import assert from 'node:assert/strict';
import { mkdir, writeFile, mkdtemp, rm, unlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { ArtworkService } from '../services/artwork.service.js';
import { DatabaseService, StoredTrack } from '../services/database.service.js';
import { ScannerService } from '../services/scanner.service.js';
import { isPathInside, pathKey, pathsOverlap, stableId } from '../utils/path-utils.js';
import { createFileResponse } from '../protocols/file-response.js';
import { validSettings } from '../ipc/settings-validation.js';

test('settings IPC accepts allowlisted themes and rejects invalid values', () => {
  assert.deepEqual(validSettings({ themePreset: 'sage', accentColor: 'amber' }), { themePreset: 'sage', accentColor: 'amber' });
  assert.throws(() => validSettings({ themePreset: 'light' }), /Invalid theme preset/);
  assert.throws(() => validSettings({ accentColor: '#ffffff' }), /Invalid accent color/);
});

test('path helpers normalize identity and reject sibling traversal', () => {
  const root = path.resolve('C:/Music');
  assert.equal(isPathInside(path.join(root, 'Artist', 'track.flac'), root), true);
  assert.equal(isPathInside(path.resolve('C:/Music Other/track.flac'), root), false);
  assert.equal(pathsOverlap(root, path.join(root, 'Artist')), true);
  assert.equal(stableId('track', pathKey(root)), stableId('track', pathKey(root)));
});

test('file responses support full content, byte ranges, HEAD and missing files', async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'audio-blabla-range-test-'));
  const filePath = path.join(temporaryRoot, 'audio.bin');
  const content = Buffer.from(Array.from({ length: 256 }, (_, index) => index));
  try {
    await writeFile(filePath, content);

    const full = await createFileResponse(filePath, new Request('music://track/test'), 'audio/test');
    assert.equal(full.status, 200);
    assert.equal(full.headers.get('accept-ranges'), 'bytes');
    assert.equal(full.headers.get('content-length'), '256');
    assert.deepEqual(Buffer.from(await full.arrayBuffer()), content);

    const partial = await createFileResponse(filePath, requestWithRange('bytes=100-199'), 'audio/test');
    assert.equal(partial.status, 206);
    assert.equal(partial.headers.get('content-range'), 'bytes 100-199/256');
    assert.equal(partial.headers.get('content-length'), '100');
    assert.deepEqual(Buffer.from(await partial.arrayBuffer()), content.subarray(100, 200));

    const openEnded = await createFileResponse(filePath, requestWithRange('bytes=200-'), 'audio/test');
    assert.equal(openEnded.status, 206);
    assert.deepEqual(Buffer.from(await openEnded.arrayBuffer()), content.subarray(200));

    const head = await createFileResponse(filePath, new Request('music://track/test', { method: 'HEAD', headers: { range: 'bytes=0-9' } }), 'audio/test');
    assert.equal(head.status, 206);
    assert.equal(head.headers.get('content-range'), 'bytes 0-9/256');
    assert.equal((await head.arrayBuffer()).byteLength, 0);

    const invalid = await createFileResponse(filePath, requestWithRange('bytes=999-1000'), 'audio/test');
    assert.equal(invalid.status, 416);
    assert.equal(invalid.headers.get('content-range'), 'bytes */256');

    const missing = await createFileResponse(path.join(temporaryRoot, 'missing.bin'), new Request('music://track/test'), 'audio/test');
    assert.equal(missing.status, 404);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test('library snapshot stores album track IDs in disc and track order', async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'audio-blabla-album-order-'));
  const databasePath = path.join(temporaryRoot, 'library.sqlite');
  const libraryPath = path.join(temporaryRoot, 'Music');
  const database = new DatabaseService(databasePath);

  try {
    const folder = database.addFolder(libraryPath, 'Music');
    database.upsertTracks(folder.id, 'scan-order', [
      createStoredTrack('alpha-title', 'Alpha title', 1, 3, libraryPath),
      createStoredTrack('zulu-title', 'Zulu title', 1, 1, libraryPath),
      createStoredTrack('disc-two', 'Disc two', 2, 1, libraryPath),
      createStoredTrack('middle-title', 'Middle title', 1, 2, libraryPath),
    ]);

    const album = database.getLibrary().albums[0];
    assert.deepEqual(album?.trackIds, ['zulu-title', 'middle-title', 'alpha-title', 'disc-two']);
  } finally {
    database.close();
    await rm(temporaryRoot, { recursive: true, force: true });
  }
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
    database.saveSettings({ defaultVolume: 0.35, repeatMode: 'all', shuffle: true, themePreset: 'ocean', accentColor: 'cyan' });

    database.close();
    database = new DatabaseService(databasePath);
    assert.equal(database.listPlaylists()[0]?.entries.length, 2);
    assert.equal(database.getSettings().defaultVolume, 0.35);
    assert.equal(database.getSettings().repeatMode, 'all');
    assert.equal(database.getSettings().themePreset, 'ocean');
    assert.equal(database.getSettings().accentColor, 'cyan');

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

function createStoredTrack(
  id: string,
  title: string,
  discNumber: number,
  trackNumber: number,
  libraryPath: string,
): StoredTrack {
  return {
    id,
    path: path.join(libraryPath, `${id}.flac`),
    fileName: `${id}.flac`,
    title,
    artist: 'Artist',
    albumArtist: 'Artist',
    album: 'Album',
    genre: null,
    year: null,
    trackNumber,
    discNumber,
    duration: 60,
    codec: 'FLAC',
    bitrate: null,
    sampleRate: null,
    bitDepth: null,
    channels: null,
    artwork: null,
    artworkHash: null,
    fileSize: null,
    lastModified: null,
    isAvailable: true,
  };
}

function requestWithRange(range: string): Request {
  return new Request('music://track/test', { headers: { range } });
}
