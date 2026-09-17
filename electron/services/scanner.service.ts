import { randomUUID } from 'node:crypto';
import { opendir, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseFile } from 'music-metadata';
import { ScanProgress } from '../../src/app/core/models/index.js';
import { canonicalPath, pathKey, stableId } from '../utils/path-utils.js';
import { ArtworkService } from './artwork.service.js';
import { DatabaseService, StoredTrack } from './database.service.js';
import { log } from '../utils/logger.js';

const AUDIO_EXTENSIONS = new Set(['.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg', '.opus']);

export class ScannerService {
  private scanning = false;
  constructor(private readonly database: DatabaseService, private readonly artwork: ArtworkService, private readonly progress: (value: ScanProgress) => void) {}

  async scan(folderIds?: string[]): Promise<void> {
    if (this.scanning) throw new Error('A library scan is already running');
    const folders = this.database.listFolders().filter((folder) => !folderIds?.length || folderIds.includes(folder.id));
    if (folderIds?.some((id) => !folders.some((folder) => folder.id === id))) throw new Error('Unknown music folder');
    this.scanning = true;
    let scannedFiles = 0; let audioFiles = 0; let warnings = 0; let lastEmit = 0;
    log('info', 'scan', 'Scan started', { folderCount: folders.length });
    const emit = (currentPath: string | null, error: string | null = null, force = false) => {
      const now = Date.now(); if (!force && now - lastEmit < 250) return; lastEmit = now;
      this.progress({ isScanning: true, scannedFiles, audioFiles, currentPath, error });
    };
    this.progress({ isScanning: true, scannedFiles: 0, audioFiles: 0, currentPath: folders[0]?.path ?? null });
    try {
      for (const folder of folders) {
        let folderWarnings = 0;
        const scanId = randomUUID(); this.database.startScan(scanId, folder.id);
        try {
          const root = await canonicalPath(folder.path);
          const files: string[] = [];
          const directories: Array<{ path: string; parentPath: string | null; name: string }> = [{ path: root, parentPath: null, name: folder.name }];
          await this.walk(root, root, files, directories, () => { scannedFiles++; emit(root); }, () => { warnings++; folderWarnings++; });
          audioFiles += files.length;
          const results = await this.readMetadata(files, folder.id, scanId, (filePath, warning) => {
            if (warning) { warnings++; folderWarnings++; log('warn', 'metadata', warning); }
            emit(filePath, warning);
          });
          for (let index = 0; index < results.length; index += 100) this.database.upsertTracks(folder.id, scanId, results.slice(index, index + 100));
          this.database.saveDirectories(folder.id, scanId, directories);
          this.database.finishScan(scanId, folder.id, folderWarnings);
        } catch (error) {
          warnings++; folderWarnings++; this.database.failScan(scanId, folderWarnings);
          log('error', 'scan', `Scan failed for ${folder.path}`, error);
          emit(folder.path, errorMessage(error), true);
        }
      }
    } finally {
      this.scanning = false;
      this.progress({ isScanning: false, scannedFiles, audioFiles, currentPath: null, error: warnings ? `${warnings} file or folder warning(s) occurred` : null });
      log('info', 'scan', 'Scan finished', { scannedFiles, audioFiles, warnings });
    }
  }

  private async walk(root: string, directory: string, files: string[], directories: Array<{ path: string; parentPath: string | null; name: string }>, onEntry: () => void, onWarning: () => void): Promise<void> {
    let handle;
    try { handle = await opendir(directory); } catch (error) { if (directory === root) throw error; onWarning(); return; }
    for await (const entry of handle) {
      onEntry(); const entryPath = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        directories.push({ path: entryPath, parentPath: directory, name: entry.name });
        await this.walk(root, entryPath, files, directories, onEntry, onWarning);
      } else if (entry.isFile() && AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(entryPath);
    }
  }

  private async readMetadata(files: string[], folderId: string, scanId: string, report: (path: string, warning: string | null) => void): Promise<StoredTrack[]> {
    const results: StoredTrack[] = []; let cursor = 0;
    const worker = async () => {
      while (cursor < files.length) {
        const filePath = files[cursor++];
        try {
          const fileStat = await stat(filePath);
          const existing = this.database.getStoredTrackByPath(filePath);
          if (existing && existing.fileSize === fileStat.size && existing.lastModified === fileStat.mtimeMs) {
            this.database.markExistingTrackSeen(folderId, scanId, existing); report(filePath, null); continue;
          }
          const metadata = await parseFile(filePath, { duration: true, skipCovers: false });
          const artworkHash = await this.artwork.save(metadata.common.picture?.[0]);
          const common = metadata.common; const format = metadata.format;
          results.push({
            id: stableId('track', pathKey(filePath)), path: filePath, fileName: path.basename(filePath), title: common.title?.trim() || path.parse(filePath).name,
            artist: common.artist?.trim() || null, albumArtist: common.albumartist?.trim() || null, album: common.album?.trim() || null,
            genre: common.genre?.[0]?.trim() || null, year: common.year ?? null, trackNumber: common.track.no ?? null, discNumber: common.disk.no ?? null,
            duration: format.duration ?? 0, codec: format.codec || format.container || null, bitrate: format.bitrate == null ? null : Math.round(format.bitrate),
            sampleRate: format.sampleRate ?? null, bitDepth: format.bitsPerSample ?? null, channels: format.numberOfChannels ?? null,
            artwork: null, artworkHash, fileSize: fileStat.size, lastModified: fileStat.mtimeMs, isAvailable: true,
          });
          report(filePath, null);
        } catch (error) { report(filePath, `Skipped ${path.basename(filePath)}: ${errorMessage(error)}`); }
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, Math.max(1, files.length)) }, () => worker()));
    return results;
  }
}

function errorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }
