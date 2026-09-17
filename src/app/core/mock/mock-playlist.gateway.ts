import { Injectable } from '@angular/core';
import { PlaylistGateway } from '../contracts/playlist.gateway';
import { Playlist, PlaylistEntry } from '../models';
import { MOCK_PLAYLISTS } from './fixtures/mock-data';

@Injectable({ providedIn: 'root' })
export class MockPlaylistGateway implements PlaylistGateway {
  private playlists: Playlist[] = JSON.parse(JSON.stringify(MOCK_PLAYLISTS));

  async getPlaylists(): Promise<Playlist[]> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    return JSON.parse(JSON.stringify(this.playlists));
  }

  async createPlaylist(name: string): Promise<Playlist> {
    const trimmed = name.trim() || 'Untitled Playlist';
    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name: trimmed,
      entries: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.playlists.push(newPlaylist);
    return JSON.parse(JSON.stringify(newPlaylist));
  }

  async renamePlaylist(id: string, name: string): Promise<Playlist> {
    const playlist = this.playlists.find((p) => p.id === id);
    if (!playlist) {
      throw new Error(`Playlist with ID "${id}" not found`);
    }
    playlist.name = name.trim() || playlist.name;
    playlist.updatedAt = Date.now();
    return JSON.parse(JSON.stringify(playlist));
  }

  async deletePlaylist(id: string): Promise<void> {
    this.playlists = this.playlists.filter((p) => p.id !== id);
  }

  async addTracks(playlistId: string, trackIds: string[]): Promise<Playlist> {
    const playlist = this.playlists.find((p) => p.id === playlistId);
    if (!playlist) {
      throw new Error(`Playlist with ID "${playlistId}" not found`);
    }

    const newEntries: PlaylistEntry[] = trackIds.map((trackId, index) => ({
      id: `entry-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
      trackId,
      addedAt: Date.now(),
    }));

    playlist.entries.push(...newEntries);
    playlist.updatedAt = Date.now();
    return JSON.parse(JSON.stringify(playlist));
  }

  async removeEntry(playlistId: string, entryId: string): Promise<Playlist> {
    const playlist = this.playlists.find((p) => p.id === playlistId);
    if (!playlist) {
      throw new Error(`Playlist with ID "${playlistId}" not found`);
    }
    playlist.entries = playlist.entries.filter((e) => e.id !== entryId);
    playlist.updatedAt = Date.now();
    return JSON.parse(JSON.stringify(playlist));
  }

  async reorderEntries(playlistId: string, entryIds: string[]): Promise<Playlist> {
    const playlist = this.playlists.find((p) => p.id === playlistId);
    if (!playlist) {
      throw new Error(`Playlist with ID "${playlistId}" not found`);
    }

    const entryMap = new Map<string, PlaylistEntry>();
    playlist.entries.forEach((e) => entryMap.set(e.id, e));

    const reordered: PlaylistEntry[] = [];
    entryIds.forEach((id) => {
      const entry = entryMap.get(id);
      if (entry) {
        reordered.push(entry);
      }
    });

    playlist.entries = reordered;
    playlist.updatedAt = Date.now();
    return JSON.parse(JSON.stringify(playlist));
  }
}
