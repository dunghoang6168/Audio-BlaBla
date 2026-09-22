import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { AudioAnalysisEngine, PlaybackEngine } from '../contracts';
import { PlaybackStateEvent, PlaybackTimeEvent, PlaybackVolumeEvent, Track } from '../models';

@Injectable({ providedIn: 'root' })
export class MockPlaybackEngine implements PlaybackEngine, AudioAnalysisEngine {
  private currentTrack: Track | null = null;
  private currentTime = 0;
  private duration = 0;
  private volume = 0.8;
  private isMuted = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private analysisFrame = 0;

  readonly isAnalysisSupported = true;

  private readonly stateChangeSubject = new BehaviorSubject<PlaybackStateEvent>({
    state: 'idle',
    track: null,
  });
  private readonly timeUpdateSubject = new Subject<PlaybackTimeEvent>();
  private readonly volumeChangeSubject = new BehaviorSubject<PlaybackVolumeEvent>({
    volume: 0.8,
    isMuted: false,
  });

  readonly stateChange$: Observable<PlaybackStateEvent> = this.stateChangeSubject.asObservable();
  readonly timeUpdate$: Observable<PlaybackTimeEvent> = this.timeUpdateSubject.asObservable();
  readonly volumeChange$: Observable<PlaybackVolumeEvent> = this.volumeChangeSubject.asObservable();

  async load(track: Track): Promise<void> {
    this.stopTimer();
    this.currentTrack = track;
    this.currentTime = 0;
    this.duration = track.duration;

    this.stateChangeSubject.next({
      state: 'loading',
      track,
    });

    // Simulate load time (50ms)
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (!track.isAvailable) {
      this.stateChangeSubject.next({
        state: 'error',
        track,
        error: {
          code: 'FILE_UNAVAILABLE',
          message: `Audio file is unavailable or missing: ${track.path}`,
          trackId: track.id,
        },
      });
      throw new Error(`Track ${track.id} is unavailable`);
    }

    this.stateChangeSubject.next({
      state: 'paused',
      track,
    });
    this.timeUpdateSubject.next({
      currentTime: 0,
      duration: this.duration,
    });
  }

  async play(): Promise<void> {
    if (!this.currentTrack) {
      return;
    }

    if (!this.currentTrack.isAvailable) {
      this.stateChangeSubject.next({
        state: 'error',
        track: this.currentTrack,
        error: {
          code: 'FILE_UNAVAILABLE',
          message: `Audio file is unavailable: ${this.currentTrack.path}`,
          trackId: this.currentTrack.id,
        },
      });
      return;
    }

    this.stateChangeSubject.next({
      state: 'playing',
      track: this.currentTrack,
    });
    this.startTimer();
  }

  pause(): void {
    this.stopTimer();
    if (this.currentTrack) {
      this.stateChangeSubject.next({
        state: 'paused',
        track: this.currentTrack,
      });
    }
  }

  seek(positionSeconds: number): void {
    const clamped = Math.max(0, Math.min(positionSeconds, this.duration));
    this.currentTime = clamped;
    this.timeUpdateSubject.next({
      currentTime: this.currentTime,
      duration: this.duration,
    });
  }

  setVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    this.volumeChangeSubject.next({
      volume: this.volume,
      isMuted: this.isMuted,
    });
  }

  setMute(muted: boolean): void {
    this.isMuted = muted;
    this.volumeChangeSubject.next({
      volume: this.volume,
      isMuted: this.isMuted,
    });
  }

  async prepareFrequencyAnalysis(): Promise<number> {
    return 1024;
  }

  readFrequencyData(target: Uint8Array<ArrayBuffer>): boolean {
    if (!this.currentTrack || target.length === 0) return false;
    const time = this.currentTime * 1.7 + this.analysisFrame++ * 0.08;
    for (let index = 0; index < target.length; index++) {
      const position = index / target.length;
      const envelope = Math.exp(-position * 2.8);
      const pulse = 0.52 + 0.28 * Math.sin(time + index * 0.17) + 0.2 * Math.sin(time * 0.47 + index * 0.043);
      target[index] = Math.round(255 * envelope * Math.max(0.08, pulse));
    }
    return true;
  }

  dispose(): void {
    this.stopTimer();
    this.currentTrack = null;
    this.currentTime = 0;
    this.duration = 0;
    this.stateChangeSubject.next({
      state: 'idle',
      track: null,
    });
  }

  private startTimer(): void {
    this.stopTimer();
    // Advance time by 1 second every 1000ms
    this.timer = setInterval(() => {
      this.currentTime += 1;
      if (this.currentTime >= this.duration) {
        this.currentTime = this.duration;
        this.timeUpdateSubject.next({
          currentTime: this.currentTime,
          duration: this.duration,
        });
        this.stopTimer();
        this.stateChangeSubject.next({
          state: 'ended',
          track: this.currentTrack,
        });
      } else {
        this.timeUpdateSubject.next({
          currentTime: this.currentTime,
          duration: this.duration,
        });
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
