import { TestBed } from '@angular/core/testing';
import { AUDIO_ANALYSIS_ENGINE, AudioAnalysisEngine, PLAYBACK_ENGINE, SETTINGS_GATEWAY } from '../../../core/contracts';
import { MockPlaybackEngine, MockSettingsGateway } from '../../../core/mock';
import { Track } from '../../../core/models';
import { PlayerService } from '../../../core/player/player.service';
import { SpectrumVisualizerComponent } from './spectrum-visualizer.component';

class FakeAnalysisEngine implements AudioAnalysisEngine {
  readonly isAnalysisSupported = true;
  prepareCount = 0;
  readCount = 0;

  async prepareFrequencyAnalysis(): Promise<number> {
    this.prepareCount++;
    return 32;
  }

  readFrequencyData(target: Uint8Array<ArrayBuffer>): boolean {
    this.readCount++;
    target.fill(128);
    return true;
  }
}

describe('SpectrumVisualizerComponent', () => {
  let analysis: FakeAnalysisEngine;
  let player: PlayerService;

  beforeEach(async () => {
    analysis = new FakeAnalysisEngine();
    await TestBed.configureTestingModule({
      imports: [SpectrumVisualizerComponent],
      providers: [
        { provide: PLAYBACK_ENGINE, useClass: MockPlaybackEngine },
        { provide: AUDIO_ANALYSIS_ENGINE, useValue: analysis },
        { provide: SETTINGS_GATEWAY, useClass: MockSettingsGateway },
      ],
    }).compileComponents();
    player = TestBed.inject(PlayerService);
  });

  it('renders an aria-hidden canvas and prepares analysis for a playing track', async () => {
    player.currentTrack.set(track());
    player.playbackState.set('playing');
    const fixture = TestBed.createComponent(SpectrumVisualizerComponent);

    fixture.detectChanges();
    await fixture.whenStable();

    const panel = fixture.nativeElement.querySelector('.spectrum-panel') as HTMLElement;
    const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    expect(panel.getAttribute('aria-hidden')).toBe('true');
    expect(canvas).toBeTruthy();
    expect(analysis.prepareCount).toBe(1);
    fixture.destroy();
  });
});

function track(): Track {
  return {
    id: `track-${'a'.repeat(64)}`,
    path: 'D:\\Music\\track.flac',
    fileName: 'track.flac',
    title: 'Track',
    artist: null,
    albumArtist: null,
    album: null,
    genre: null,
    year: null,
    trackNumber: null,
    discNumber: null,
    duration: 120,
    codec: 'FLAC',
    bitrate: null,
    sampleRate: 44_100,
    bitDepth: 16,
    channels: 2,
    artwork: null,
    fileSize: null,
    lastModified: null,
    isAvailable: true,
  };
}
