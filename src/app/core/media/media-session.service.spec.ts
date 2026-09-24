import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PlaybackState, Track } from '../models';
import { PlayerService } from '../player/player.service';
import {
  MEDIA_METADATA_FACTORY,
  MEDIA_SESSION,
  MediaSessionService,
} from './media-session.service';

const MEDIA_ACTIONS: readonly MediaSessionAction[] = [
  'play',
  'pause',
  'previoustrack',
  'nexttrack',
  'stop',
  'seekbackward',
  'seekforward',
  'seekto',
];

describe('MediaSessionService', () => {
  let mediaSession: FakeMediaSession;
  let player: FakePlayer;

  beforeEach(() => {
    mediaSession = new FakeMediaSession();
    player = new FakePlayer();
    TestBed.configureTestingModule({
      providers: [
        MediaSessionService,
        { provide: PlayerService, useValue: player },
        { provide: MEDIA_SESSION, useValue: mediaSession as unknown as MediaSession },
        {
          provide: MEDIA_METADATA_FACTORY,
          useValue: (init: MediaMetadataInit) => init as unknown as MediaMetadata,
        },
      ],
    });
  });

  it('registers each handler once for the application-scoped service', () => {
    const first = TestBed.inject(MediaSessionService);
    const second = TestBed.inject(MediaSessionService);

    expect(second).toBe(first);
    for (const action of MEDIA_ACTIONS) {
      expect(mediaSession.registrationCount.get(action)).toBe(1);
      expect(mediaSession.handlers.get(action)).toEqual(jasmine.any(Function));
    }
  });

  it('routes play and pause to explicit idempotent player operations', () => {
    TestBed.inject(MediaSessionService);

    mediaSession.trigger('play');
    mediaSession.trigger('play');
    mediaSession.trigger('pause');
    mediaSession.trigger('pause');

    expect(player.play).toHaveBeenCalledTimes(2);
    expect(player.pause).toHaveBeenCalledTimes(2);
  });

  it('routes next, previous, stop and seek actions through PlayerService', () => {
    TestBed.inject(MediaSessionService);

    mediaSession.trigger('nexttrack');
    mediaSession.trigger('previoustrack');
    mediaSession.trigger('stop');
    mediaSession.trigger('seekbackward', { seekOffset: 7 });
    mediaSession.trigger('seekforward');
    mediaSession.trigger('seekto', { seekTime: 42 });

    expect(player.next).toHaveBeenCalledTimes(1);
    expect(player.previous).toHaveBeenCalledTimes(1);
    expect(player.stop).toHaveBeenCalledTimes(1);
    expect(player.seekBy).toHaveBeenCalledWith(-7);
    expect(player.seekBy).toHaveBeenCalledWith(10);
    expect(player.seek).toHaveBeenCalledWith(42);
  });

  it('synchronizes metadata, playback state and clamped finite position', () => {
    TestBed.inject(MediaSessionService);
    const track = createTrack();

    player.currentTrack.set(track);
    player.duration.set(240);
    player.currentTime.set(300);
    player.playbackState.set('playing');
    TestBed.tick();

    expect(mediaSession.metadata).toEqual(jasmine.objectContaining({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: [{ src: track.artwork }],
    }));
    expect(mediaSession.playbackState).toBe('playing');
    expect(mediaSession.positions.at(-1)).toEqual({
      duration: 240,
      position: 240,
      playbackRate: 1,
    });

    player.currentTime.set(Number.NaN);
    player.playbackState.set('paused');
    TestBed.tick();
    expect(mediaSession.playbackState).toBe('paused');
    expect(mediaSession.positions.at(-1)?.position).toBe(0);

    player.duration.set(Number.POSITIVE_INFINITY);
    TestBed.tick();
    expect(mediaSession.positions.at(-1)).toBeUndefined();

    player.currentTrack.set(null);
    TestBed.tick();
    expect(mediaSession.metadata).toBeNull();
    expect(mediaSession.playbackState).toBe('none');
  });

  it('continues when an individual action is unsupported', () => {
    mediaSession.unsupportedActions.add('seekto');

    expect(() => TestBed.inject(MediaSessionService)).not.toThrow();
    expect(mediaSession.handlers.has('seekto')).toBeFalse();
    expect(mediaSession.handlers.get('play')).toEqual(jasmine.any(Function));
  });

  it('does nothing when Media Session is unavailable', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        MediaSessionService,
        { provide: PlayerService, useValue: player },
        { provide: MEDIA_SESSION, useValue: null },
      ],
    });

    expect(() => TestBed.inject(MediaSessionService)).not.toThrow();
  });

  it('removes registered handlers and clears session state on cleanup', () => {
    const service = TestBed.inject(MediaSessionService);
    player.currentTrack.set(createTrack());
    player.duration.set(100);
    TestBed.tick();

    service.ngOnDestroy();

    for (const action of MEDIA_ACTIONS) {
      expect(mediaSession.handlers.get(action)).toBeNull();
    }
    expect(mediaSession.metadata).toBeNull();
    expect(mediaSession.playbackState).toBe('none');
    expect(mediaSession.positions.at(-1)).toBeUndefined();
  });
});

class FakeMediaSession {
  metadata: MediaMetadata | null = null;
  playbackState: MediaSessionPlaybackState = 'none';
  readonly handlers = new Map<MediaSessionAction, MediaSessionActionHandler | null>();
  readonly registrationCount = new Map<MediaSessionAction, number>();
  readonly unsupportedActions = new Set<MediaSessionAction>();
  readonly positions: Array<MediaPositionState | undefined> = [];

  setActionHandler(action: MediaSessionAction, handler: MediaSessionActionHandler | null): void {
    if (this.unsupportedActions.has(action)) throw new TypeError(`Unsupported action: ${action}`);
    this.registrationCount.set(action, (this.registrationCount.get(action) ?? 0) + 1);
    this.handlers.set(action, handler);
  }

  setPositionState(state?: MediaPositionState): void {
    this.positions.push(state);
  }

  trigger(action: MediaSessionAction, details: Partial<MediaSessionActionDetails> = {}): void {
    const handler = this.handlers.get(action);
    if (handler) handler({ action, ...details } as MediaSessionActionDetails);
  }
}

class FakePlayer {
  readonly currentTrack = signal<Track | null>(null);
  readonly playbackState = signal<PlaybackState>('idle');
  readonly currentTime = signal(0);
  readonly duration = signal(0);
  readonly play = jasmine.createSpy('play').and.resolveTo();
  readonly pause = jasmine.createSpy('pause');
  readonly previous = jasmine.createSpy('previous').and.resolveTo();
  readonly next = jasmine.createSpy('next').and.resolveTo();
  readonly stop = jasmine.createSpy('stop');
  readonly seekBy = jasmine.createSpy('seekBy');
  readonly seek = jasmine.createSpy('seek');
}

function createTrack(): Track {
  return {
    id: 'media-track',
    path: 'D:/Music/media-track.flac',
    fileName: 'media-track.flac',
    title: 'Media Track',
    artist: 'Media Artist',
    albumArtist: 'Media Artist',
    album: 'Media Album',
    genre: 'Electronic',
    year: 2026,
    trackNumber: 1,
    discNumber: 1,
    duration: 240,
    codec: 'FLAC',
    bitrate: 1_411_000,
    sampleRate: 44_100,
    bitDepth: 16,
    channels: 2,
    artwork: 'app-media://artwork/media-track',
    fileSize: 42_000_000,
    lastModified: 1_800_000_000_000,
    isAvailable: true,
  };
}
