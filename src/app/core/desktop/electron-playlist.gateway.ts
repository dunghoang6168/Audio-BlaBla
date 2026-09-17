import { Injectable } from '@angular/core';
import { PlaylistGateway } from '../contracts';
import { Playlist } from '../models';
import { getDesktopApi } from './desktop-api';

@Injectable()
export class ElectronPlaylistGateway implements PlaylistGateway {
  private readonly api = getDesktopApi();
  private requireApi() { if (!this.api) throw new Error('Electron desktop API is unavailable'); return this.api; }
  getPlaylists(): Promise<Playlist[]> { return this.requireApi().playlists.list(); }
  createPlaylist(name: string): Promise<Playlist> { return this.requireApi().playlists.create(name); }
  renamePlaylist(id: string, name: string): Promise<Playlist> { return this.requireApi().playlists.rename(id, name); }
  deletePlaylist(id: string): Promise<void> { return this.requireApi().playlists.delete(id); }
  addTracks(playlistId: string, trackIds: string[]): Promise<Playlist> { return this.requireApi().playlists.addTracks(playlistId, trackIds); }
  removeEntry(playlistId: string, entryId: string): Promise<Playlist> { return this.requireApi().playlists.removeEntry(playlistId, entryId); }
  reorderEntries(playlistId: string, entryIds: string[]): Promise<Playlist> { return this.requireApi().playlists.reorderEntries(playlistId, entryIds); }
}
