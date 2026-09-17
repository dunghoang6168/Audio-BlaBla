import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopApi } from '../src/app/core/desktop/desktop-api';
import type { ScanProgress } from '../src/app/core/models';

const api: DesktopApi = {
  runtime: 'electron',
  ping: () => ipcRenderer.invoke('system:ping'),
  library: {
    getSnapshot: () => ipcRenderer.invoke('library:get-snapshot'),
    getFolderTree: (folderId) => ipcRenderer.invoke('library:get-folder-tree', folderId),
    selectAndAddFolders: () => ipcRenderer.invoke('library:select-and-add-folders'),
    removeFolder: (folderId) => ipcRenderer.invoke('library:remove-folder', folderId),
    startScan: (folderIds) => ipcRenderer.invoke('library:start-scan', folderIds),
    onScanProgress: (listener) => {
      const handler = (_event: Electron.IpcRendererEvent, value: ScanProgress) => listener(value);
      ipcRenderer.on('library:scan-progress', handler);
      return () => ipcRenderer.removeListener('library:scan-progress', handler);
    },
  },
  playlists: {
    list: () => ipcRenderer.invoke('playlists:list'),
    create: (name) => ipcRenderer.invoke('playlists:create', name),
    rename: (id, name) => ipcRenderer.invoke('playlists:rename', id, name),
    delete: (id) => ipcRenderer.invoke('playlists:delete', id),
    addTracks: (playlistId, trackIds) => ipcRenderer.invoke('playlists:add-tracks', playlistId, trackIds),
    removeEntry: (playlistId, entryId) => ipcRenderer.invoke('playlists:remove-entry', playlistId, entryId),
    reorderEntries: (playlistId, entryIds) => ipcRenderer.invoke('playlists:reorder', playlistId, entryIds),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (value) => ipcRenderer.invoke('settings:save', value),
  },
};

contextBridge.exposeInMainWorld('desktop', api);
