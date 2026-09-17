import { Track } from './track.model';

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

export interface PlaybackError {
  code: string;
  message: string;
  trackId?: string;
}

export interface PlaybackTimeEvent {
  currentTime: number; // in seconds
  duration: number; // in seconds
}

export interface PlaybackStateEvent {
  state: PlaybackState;
  track: Track | null;
  error?: PlaybackError;
}

export interface PlaybackVolumeEvent {
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
}
