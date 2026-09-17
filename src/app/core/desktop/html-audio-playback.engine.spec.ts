import { Track } from '../models';
import { HtmlAudioPlaybackEngine } from './html-audio-playback.engine';

class FakeAudio extends EventTarget {
  static latest: FakeAudio;
  volume = 1;
  muted = false;
  currentTime = 0;
  duration = 120;
  paused = true;
  ended = false;
  error: MediaError | null = null;
  src = '';

  constructor() {
    super();
    FakeAudio.latest = this;
  }

  load(): void {}
  pause(): void { this.paused = true; this.dispatchEvent(new Event('pause')); }
  play(): Promise<void> { this.paused = false; this.dispatchEvent(new Event('play')); return Promise.resolve(); }
  removeAttribute(name: string): void { if (name === 'src') this.src = ''; }
}

describe('HtmlAudioPlaybackEngine', () => {
  const originalAudio = window.Audio;

  beforeEach(() => Object.defineProperty(window, 'Audio', { configurable: true, value: FakeAudio }));
  afterEach(() => Object.defineProperty(window, 'Audio', { configurable: true, value: originalAudio }));

  it('loads tracks through the ID-only music protocol', async () => {
    const engine = new HtmlAudioPlaybackEngine();
    const loaded = engine.load(track('track-' + 'a'.repeat(64)));

    expect(FakeAudio.latest.src).toBe(`music://track/${'track-' + 'a'.repeat(64)}`);
    FakeAudio.latest.dispatchEvent(new Event('loadedmetadata'));
    await loaded;
  });

  it('rejects a pending load when a newer track replaces it', async () => {
    const engine = new HtmlAudioPlaybackEngine();
    const first = engine.load(track('track-' + 'a'.repeat(64)));
    const second = engine.load(track('track-' + 'b'.repeat(64)));

    FakeAudio.latest.dispatchEvent(new Event('loadedmetadata'));
    await expectAsync(first).toBeRejectedWithError('Playback load superseded');
    await expectAsync(second).toBeResolved();
  });

  it('clamps volume and seek values', () => {
    const engine = new HtmlAudioPlaybackEngine();
    engine.setVolume(2);
    engine.seek(500);
    expect(FakeAudio.latest.volume).toBe(1);
    expect(FakeAudio.latest.currentTime).toBe(120);
  });
});

function track(id: string): Track {
  return {
    id, path: 'D:\\Music\\track.flac', fileName: 'track.flac', title: 'Track', artist: null,
    albumArtist: null, album: null, genre: null, year: null, trackNumber: null, discNumber: null,
    duration: 120, codec: 'FLAC', bitrate: null, sampleRate: 44100, bitDepth: 16, channels: 2,
    artwork: null, fileSize: null, lastModified: null, isAvailable: true,
  };
}
