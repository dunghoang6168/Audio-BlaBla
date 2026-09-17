import { dialog, ipcMain, type BrowserWindow, type IpcMainInvokeEvent } from 'electron';
import path from 'node:path';
import { MusicFolder, ScanProgress } from '../../src/app/core/models/index.js';
import { canonicalPath, pathsOverlap } from '../utils/path-utils.js';
import { DatabaseService } from '../services/database.service.js';
import { ScannerService } from '../services/scanner.service.js';

const ID_PATTERN = /^[a-z]+-[a-f0-9]{64}$/;

export function registerIpc(database: DatabaseService, scanner: ScannerService, getWindow: () => BrowserWindow | null, development: boolean): void {
  handle('system:ping', () => 'pong', development);
  handle('library:get-snapshot', () => database.getLibrary(), development);
  handle('library:get-folder-tree', (_event, folderId) => database.getFolderTree(validId(folderId)), development);
  handle('library:select-and-add-folders', async () => {
    const window = getWindow();
    const options: Electron.OpenDialogOptions = { properties: ['openDirectory', 'multiSelections'] };
    const result = window ? await dialog.showOpenDialog(window, options) : await dialog.showOpenDialog(options);
    if (result.canceled) return [];
    const registered = database.listFolders();
    const added: MusicFolder[] = [];
    for (const selectedPath of result.filePaths) {
      const canonical = await canonicalPath(selectedPath);
      if (registered.some((folder) => pathsOverlap(folder.path, canonical)) || added.some((folder) => pathsOverlap(folder.path, canonical))) continue;
      added.push(database.addFolder(canonical, path.basename(canonical)));
    }
    return added;
  }, development);
  handle('library:remove-folder', (_event, folderId) => database.removeFolder(validId(folderId)), development);
  handle('library:start-scan', (_event, folderIds) => {
    const ids = folderIds === undefined ? undefined : validIdArray(folderIds);
    void scanner.scan(ids).catch((error) => broadcastProgress(getWindow(), { isScanning: false, scannedFiles: 0, audioFiles: 0, currentPath: null, error: errorMessage(error) }));
  }, development);

  handle('playlists:list', () => database.listPlaylists(), development);
  handle('playlists:create', (_event, name) => database.createPlaylist(validName(name)), development);
  handle('playlists:rename', (_event, id, name) => database.renamePlaylist(validId(id), validName(name)), development);
  handle('playlists:delete', (_event, id) => database.deletePlaylist(validId(id)), development);
  handle('playlists:add-tracks', (_event, id, trackIds) => database.addPlaylistTracks(validId(id), validIdArray(trackIds)), development);
  handle('playlists:remove-entry', (_event, id, entryId) => database.removePlaylistEntry(validId(id), validId(entryId)), development);
  handle('playlists:reorder', (_event, id, entryIds) => database.reorderPlaylist(validId(id), validIdArray(entryIds)), development);
  handle('settings:get', () => database.getSettings(), development);
  handle('settings:save', (_event, value) => database.saveSettings(validSettings(value)), development);
}

export function broadcastProgress(window: BrowserWindow | null, progress: ScanProgress): void {
  if (window && !window.isDestroyed()) window.webContents.send('library:scan-progress', progress);
}

function handle(channel: string, listener: (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown, development: boolean): void {
  ipcMain.handle(channel, (event, ...args) => {
    if (!trustedSender(event, development)) throw new Error('Untrusted IPC sender');
    try { return listener(event, ...args); } catch (error) { console.error(`[ipc:${channel}]`, error); throw error; }
  });
}

function trustedSender(event: IpcMainInvokeEvent, development: boolean): boolean {
  const url = event.senderFrame?.url ?? '';
  return url.startsWith('app://audio-blabla/') || (development && url.startsWith('http://localhost:4200/'));
}
function validId(value: unknown): string { if (typeof value !== 'string' || !ID_PATTERN.test(value)) throw new Error('Invalid identifier'); return value; }
function validIdArray(value: unknown): string[] { if (!Array.isArray(value) || value.length > 10000) throw new Error('Invalid identifier list'); return value.map(validId); }
function validName(value: unknown): string { if (typeof value !== 'string' || value.trim().length < 1 || value.trim().length > 200) throw new Error('Invalid name'); return value.trim(); }
function validSettings(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid settings');
  const input = value as Record<string, unknown>; const result: Record<string, unknown> = {};
  if ('defaultVolume' in input) { if (typeof input['defaultVolume'] !== 'number') throw new Error('Invalid volume'); result['defaultVolume'] = input['defaultVolume']; }
  if ('repeatMode' in input) { if (!['off','one','all'].includes(String(input['repeatMode']))) throw new Error('Invalid repeat mode'); result['repeatMode'] = input['repeatMode']; }
  if ('shuffle' in input) { if (typeof input['shuffle'] !== 'boolean') throw new Error('Invalid shuffle setting'); result['shuffle'] = input['shuffle']; }
  return result;
}
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }
