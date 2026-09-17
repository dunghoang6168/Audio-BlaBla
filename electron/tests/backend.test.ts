import assert from 'node:assert/strict';
import { mkdir, writeFile, mkdtemp, rm, unlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { ArtworkService } from '../services/artwork.service.js';
import { DatabaseService } from '../services/database.service.js';
import { ScannerService } from '../services/scanner.service.js';
import { isPathInside, pathKey, pathsOverlap, stableId } from '../utils/path-utils.js';

test('path helpers normalize identity and reject sibling traversal', () => {
  const root = path.resolve('C:/Music');
  assert.equal(isPathInside(path.join(root, 'Artist', 'track.flac'), root), true);
  assert.equal(isPathInside(path.resolve('C:/Music Other/track.flac'), root), false);
  assert.equal(pathsOverlap(root, path.join(root, 'Artist')), true);
  assert.equal(stableId('track', pathKey(root)), stableId('track', pathKey(root)));
});

test('scanner, reconciliation, playlists, settings and database persistence', async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'audio-blabla-test-'));
  const libraryPath = path.join(temporaryRoot, 'Music');
  const databasePath = path.join(temporaryRoot, 'library.sqlite');
  const artworkPath = path.join(temporaryRoot, 'artwork');
  const audioPath = path.join(libraryPath, 'Tone #1.wav');
  let database: DatabaseService | null = null;

  try {
    await mkdir(libraryPath, { recursive: true });
    await writeFile(audioPath, createWaveFile(), { flag: 'wx' });

    database = new DatabaseService(databasePath);
    const folder = database.addFolder(libraryPath, 'Music');
    const progress: Array<{ isScanning: boolean; audioFiles: number }> = [];
    const scanner = new ScannerService(database, new ArtworkService(artworkPath, database), (value) => progress.push(value));

    await scanner.scan([folder.id]);
    let snapshot = database.getLibrary();
    assert.equal(snapshot.tracks.length, 1);
    assert.equal(snapshot.tracks[0]?.title, 'Tone #1');
    assert.equal(snapshot.tracks[0]?.sampleRate, 44100);
    assert.equal(snapshot.tracks[0]?.bitDepth, 16);
    assert.equal(progress.at(-1)?.isScanning, false);
    assert.equal(progress.at(-1)?.audioFiles, 1);

    const firstTrackId = snapshot.tracks[0]!.id;
    await scanner.scan([folder.id]);
    snapshot = database.getLibrary();
    assert.equal(snapshot.tracks.length, 1);
    assert.equal(snapshot.tracks[0]?.id, firstTrackId);

    const playlist = database.createPlaylist('Test');
    const withDuplicates = database.addPlaylistTracks(playlist.id, [firstTrackId, firstTrackId]);
    assert.equal(withDuplicates.entries.length, 2);
    assert.notEqual(withDuplicates.entries[0]?.id, withDuplicates.entries[1]?.id);
    database.saveSettings({ defaultVolume: 0.35, repeatMode: 'all', shuffle: true });

    database.close();
    database = new DatabaseService(databasePath);
    assert.equal(database.listPlaylists()[0]?.entries.length, 2);
    assert.equal(database.getSettings().defaultVolume, 0.35);
    assert.equal(database.getSettings().repeatMode, 'all');

    await unlink(audioPath);
    const reopenedScanner = new ScannerService(database, new ArtworkService(artworkPath, database), () => undefined);
    await reopenedScanner.scan([folder.id]);
    assert.equal(database.getLibrary().tracks[0]?.isAvailable, false);
    assert.equal(database.listPlaylists()[0]?.entries.length, 2);
  } finally {
    database?.close();
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

function createWaveFile(): Buffer {
  const sampleRate = 44100;
  const sampleCount = 4410;
  const dataSize = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}
