export interface MusicFolder {
  id: string;
  path: string;
  name: string;
  addedAt: number; // milliseconds timestamp
}

export interface FolderNode {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  trackId?: string | null;
  children?: FolderNode[];
}
