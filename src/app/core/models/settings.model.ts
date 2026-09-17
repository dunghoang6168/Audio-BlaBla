import { MusicFolder } from './folder.model';

export type RepeatMode = 'off' | 'one' | 'all';

export interface Settings {
  musicFolders: MusicFolder[];
  defaultVolume: number; // 0.0 to 1.0
  repeatMode: RepeatMode;
  shuffle: boolean;
  theme: 'dark';
}
