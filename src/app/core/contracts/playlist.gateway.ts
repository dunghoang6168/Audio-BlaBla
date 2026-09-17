import { InjectionToken } from '@angular/core';
import { Playlist } from '../models';

export interface PlaylistGateway {
  getPlaylists(): Promise<Playlist[]>;
  createPlaylist(name: string): Promise<Playlist>;
  renamePlaylist(id: string, name: string): Promise<Playlist>;
  deletePlaylist(id: string): Promise<void>;
  addTracks(playlistId: string, trackIds: string[]): Promise<Playlist>;
  removeEntry(playlistId: string, entryId: string): Promise<Playlist>;
  reorderEntries(playlistId: string, entryIds: string[]): Promise<Playlist>;
}

export const PLAYLIST_GATEWAY = new InjectionToken<PlaylistGateway>('PLAYLIST_GATEWAY');
