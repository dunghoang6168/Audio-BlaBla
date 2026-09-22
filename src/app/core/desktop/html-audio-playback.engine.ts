import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { AudioAnalysisEngine, PlaybackEngine } from '../contracts';
import { PlaybackStateEvent, PlaybackTimeEvent, PlaybackVolumeEvent, Track } from '../models';

@Injectable()
export class HtmlAudioPlaybackEngine implements PlaybackEngine, AudioAnalysisEngine {
  private readonly audio = new Audio();
  private currentTrack: Track | null = null;
  private loadSequence = 0;
  private readonly state = new BehaviorSubject<PlaybackStateEvent>({ state: 'idle', track: null });
  private readonly time = new Subject<PlaybackTimeEvent>();
  private readonly volumeState = new BehaviorSubject<PlaybackVolumeEvent>({ volume: 0.8, isMuted: false });
  private audioContext: AudioContext | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private analysisRequested = false;
  private analysisFailed = false;

  readonly isAnalysisSupported = typeof globalThis.AudioContext === 'function';
  readonly stateChange$: Observable<PlaybackStateEvent> = this.state.asObservable();
  readonly timeUpdate$: Observable<PlaybackTimeEvent> = this.time.asObservable();
  readonly volumeChange$: Observable<PlaybackVolumeEvent> = this.volumeState.asObservable();

  constructor() {
    this.audio.crossOrigin = 'anonymous';
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
  async play(): Promise<void> {
    if (this.analysisRequested && !this.analyser && !this.analysisFailed) {
      try { await this.prepareFrequencyAnalysis(); } catch { /* Playback remains available without analysis. */ }
    }
    if (this.analysisRequested && this.audioContext?.state === 'suspended') {
      try { await this.audioContext.resume(); } catch { /* Playback remains available without analysis. */ }
    }
    await this.audio.play();
  }
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
  async prepareFrequencyAnalysis(): Promise<number> {
    this.analysisRequested = true;
    if (!this.isAnalysisSupported || this.analysisFailed) return 0;

    if (this.analyser && this.audioContext) {
      if (this.audioContext.state === 'suspended') {
        try { await this.audioContext.resume(); } catch { return 0; }
      }
      return this.audioContext.state === 'running' ? this.analyser.frequencyBinCount : 0;
    }

    const context = new AudioContext();
    try {
      if (context.state === 'suspended') await context.resume();
      if (context.state !== 'running') {
        await context.close();
        return 0;
      }
    } catch {
      try { await context.close(); } catch { /* Nothing else to release. */ }
      return 0;
    }

    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.78;
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.connect(context.destination);

    let source: MediaElementAudioSourceNode | null = null;
    try {
      source = context.createMediaElementSource(this.audio);
      source.connect(analyser);
      this.audioContext = context;
      this.mediaSource = source;
      this.analyser = analyser;
      return analyser.frequencyBinCount;
    } catch {
      this.analysisFailed = true;
      try { source?.disconnect(); } catch { /* The source may not have connected. */ }
      if (source) {
        try { source.connect(context.destination); } catch { /* Audio element fallback remains available where possible. */ }
        this.audioContext = context;
        this.mediaSource = source;
      } else {
        try { await context.close(); } catch { /* Nothing else to release. */ }
      }
      return 0;
    }
  }
  readFrequencyData(target: Uint8Array<ArrayBuffer>): boolean {
    if (!this.analyser || this.audioContext?.state !== 'running' || target.length < this.analyser.frequencyBinCount) return false;
    this.analyser.getByteFrequencyData(target);
    return true;
  }
  dispose(): void {
    this.loadSequence++;
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
    try { this.mediaSource?.disconnect(); } catch { /* It may already be disconnected. */ }
    try { this.analyser?.disconnect(); } catch { /* It may already be disconnected. */ }
    if (this.audioContext) void this.audioContext.close().catch(() => undefined);
    this.audioContext = null;
    this.mediaSource = null;
    this.analyser = null;
    this.currentTrack = null;
    this.state.next({ state: 'idle', track: null });
  }
  private emitTime(): void { this.time.next({ currentTime: Number.isFinite(this.audio.currentTime) ? this.audio.currentTime : 0, duration: Number.isFinite(this.audio.duration) ? this.audio.duration : (this.currentTrack?.duration ?? 0) }); }
}
