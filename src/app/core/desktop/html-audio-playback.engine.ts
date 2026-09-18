import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { PlaybackEngine } from '../contracts';
import { PlaybackStateEvent, PlaybackTimeEvent, PlaybackVolumeEvent, Track } from '../models';

@Injectable()
export class HtmlAudioPlaybackEngine implements PlaybackEngine {
  private readonly audio = new Audio();
  private currentTrack: Track | null = null;
  private loadSequence = 0;
  private readonly state = new BehaviorSubject<PlaybackStateEvent>({ state: 'idle', track: null });
  private readonly time = new Subject<PlaybackTimeEvent>();
  private readonly volumeState = new BehaviorSubject<PlaybackVolumeEvent>({ volume: 0.8, isMuted: false });
  readonly stateChange$: Observable<PlaybackStateEvent> = this.state.asObservable();
  readonly timeUpdate$: Observable<PlaybackTimeEvent> = this.time.asObservable();
  readonly volumeChange$: Observable<PlaybackVolumeEvent> = this.volumeState.asObservable();

  constructor() {
    this.audio.volume = 0.8;
    this.audio.addEventListener('play', () => this.state.next({ state: 'playing', track: this.currentTrack }));
    this.audio.addEventListener('pause', () => { if (!this.audio.ended && this.currentTrack) this.state.next({ state: 'paused', track: this.currentTrack }); });
    this.audio.addEventListener('ended', () => this.state.next({ state: 'ended', track: this.currentTrack }));
    this.audio.addEventListener('waiting', () => this.state.next({ state: 'loading', track: this.currentTrack }));
    this.audio.addEventListener('canplay', () => {
      if (this.currentTrack) this.state.next({ state: this.audio.paused ? 'paused' : 'playing', track: this.currentTrack });
    });
    this.audio.addEventListener('timeupdate', () => this.emitTime());
    this.audio.addEventListener('durationchange', () => this.emitTime());
    this.audio.addEventListener('seeking', () => this.emitTime());
    this.audio.addEventListener('seeked', () => this.emitTime());
    this.audio.addEventListener('volumechange', () => this.volumeState.next({ volume: this.audio.volume, isMuted: this.audio.muted }));
    this.audio.addEventListener('error', () => this.state.next({ state: 'error', track: this.currentTrack, error: {
      code: `MEDIA_${this.audio.error?.code ?? 'UNKNOWN'}`,
      message: this.audio.error?.message || 'Unable to play this audio file',
      trackId: this.currentTrack?.id,
    } }));
  }

  load(track: Track): Promise<void> {
    const sequence = ++this.loadSequence;
    this.audio.pause();
    this.currentTrack = track;
    this.state.next({ state: 'loading', track });
    return new Promise<void>((resolve, reject) => {
      const cleanup = () => { this.audio.removeEventListener('loadedmetadata', loaded); this.audio.removeEventListener('error', failed); };
      const loaded = () => { cleanup(); if (sequence !== this.loadSequence) return reject(new Error('Playback load superseded')); this.emitTime(); resolve(); };
      const failed = () => { cleanup(); reject(new Error(this.audio.error?.message || 'Unable to load audio file')); };
      this.audio.addEventListener('loadedmetadata', loaded, { once: true });
      this.audio.addEventListener('error', failed, { once: true });
      this.audio.src = `music://track/${encodeURIComponent(track.id)}`;
      this.audio.load();
    });
  }
  async play(): Promise<void> { await this.audio.play(); }
  pause(): void { this.audio.pause(); }
  seek(positionSeconds: number): void {
    const mediaDuration = Number.isFinite(this.audio.duration) && this.audio.duration > 0 ? this.audio.duration : null;
    const trackDuration = this.currentTrack && Number.isFinite(this.currentTrack.duration) && this.currentTrack.duration > 0 ? this.currentTrack.duration : 0;
    const duration = mediaDuration ?? trackDuration;
    this.audio.currentTime = Math.max(0, Math.min(positionSeconds, duration));
    this.emitTime();
  }
  setVolume(volume: number): void { this.audio.volume = Math.max(0, Math.min(1, volume)); }
  setMute(isMuted: boolean): void { this.audio.muted = isMuted; }
  dispose(): void { this.loadSequence++; this.audio.pause(); this.audio.removeAttribute('src'); this.audio.load(); this.currentTrack = null; this.state.next({ state: 'idle', track: null }); }
  private emitTime(): void { this.time.next({ currentTime: Number.isFinite(this.audio.currentTime) ? this.audio.currentTime : 0, duration: Number.isFinite(this.audio.duration) ? this.audio.duration : (this.currentTrack?.duration ?? 0) }); }
}
