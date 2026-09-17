import { LibrarySnapshot } from '../contracts/library.gateway';
import { FolderNode, MusicFolder, Playlist, ScanProgress, Settings } from '../models';

export interface DesktopApi {
  readonly runtime: 'electron';
  ping(): Promise<'pong'>;
  library: {
    getSnapshot(): Promise<LibrarySnapshot>;
    getFolderTree(folderId: string): Promise<FolderNode | null>;
    selectAndAddFolders(): Promise<MusicFolder[]>;
    removeFolder(folderId: string): Promise<void>;
    startScan(folderIds?: string[]): Promise<void>;
    onScanProgress(listener: (progress: ScanProgress) => void): () => void;
  };
  playlists: {
    list(): Promise<Playlist[]>;
    create(name: string): Promise<Playlist>;
    rename(id: string, name: string): Promise<Playlist>;
    delete(id: string): Promise<void>;
    addTracks(playlistId: string, trackIds: string[]): Promise<Playlist>;
    removeEntry(playlistId: string, entryId: string): Promise<Playlist>;
    reorderEntries(playlistId: string, entryIds: string[]): Promise<Playlist>;
  };
  settings: {
    get(): Promise<Settings>;
    save(value: Partial<Settings>): Promise<Settings>;
  };
}

export function getDesktopApi(): DesktopApi | undefined {
  return typeof window !== 'undefined' ? window.desktop : undefined;
}
