import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Track, PlaybackStateEvent, PlaybackTimeEvent, PlaybackVolumeEvent } from '../models';

export interface PlaybackEngine {
  load(track: Track): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  seek(positionSeconds: number): void;
  setVolume(volume: number): void;
  setMute(isMuted: boolean): void;
  dispose(): void;

  readonly stateChange$: Observable<PlaybackStateEvent>;
  readonly timeUpdate$: Observable<PlaybackTimeEvent>;
  readonly volumeChange$: Observable<PlaybackVolumeEvent>;
}

export const PLAYBACK_ENGINE = new InjectionToken<PlaybackEngine>('PLAYBACK_ENGINE');
