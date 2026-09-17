export interface PlaylistEntry {
  id: string; // Unique entry ID (allows the same track to appear multiple times in a playlist)
  trackId: string;
  addedAt: number; // milliseconds timestamp
}

export interface Playlist {
  id: string;
  name: string;
  entries: PlaylistEntry[];
  createdAt: number;
  updatedAt: number;
}
