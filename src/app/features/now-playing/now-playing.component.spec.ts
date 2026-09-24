import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AUDIO_ANALYSIS_ENGINE, PLAYBACK_ENGINE, SETTINGS_GATEWAY } from '../../core/contracts';
import { RightPanelService } from '../../core/layout/right-panel.service';
import { MockPlaybackEngine, MockSettingsGateway } from '../../core/mock';
import { MOCK_TRACKS } from '../../core/mock/fixtures/mock-data';
import { PlayerService } from '../../core/player/player.service';
import { NowPlayingComponent } from './now-playing.component';

describe('NowPlayingComponent', () => {
  let fixture: ComponentFixture<NowPlayingComponent>;
  let player: PlayerService;
  let rightPanels: RightPanelService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NowPlayingComponent],
      providers: [
        provideRouter([]),
        MockPlaybackEngine,
        { provide: PLAYBACK_ENGINE, useExisting: MockPlaybackEngine },
        { provide: AUDIO_ANALYSIS_ENGINE, useExisting: MockPlaybackEngine },
        { provide: SETTINGS_GATEWAY, useClass: MockSettingsGateway },
        PlayerService,
      ],
    }).compileComponents();

    player = TestBed.inject(PlayerService);
    rightPanels = TestBed.inject(RightPanelService);
    player.currentTrack.set(MOCK_TRACKS[0]);
    player.duration.set(MOCK_TRACKS[0].duration);
    fixture = TestBed.createComponent(NowPlayingComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('hides the technical summary while Track Properties is open', () => {
    const summary = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.technical-specs-card')!;
    expect(getComputedStyle(summary).display).not.toBe('none');

    rightPanels.openTrackDetails(summary);
    fixture.detectChanges();
    expect(summary.classList).toContain('hidden-while-details-open');
    expect(getComputedStyle(summary).display).toBe('none');

    rightPanels.closeTrackDetails(false);
    fixture.detectChanges();
    expect(getComputedStyle(summary).display).not.toBe('none');
  });

  it('omits the source-quality header and uses the compact fixed scrollbar', () => {
    const element = fixture.nativeElement as HTMLElement;
    const page = element.querySelector<HTMLElement>('.now-playing-page')!;

    expect(element.querySelector('.badge-source-quality')).toBeNull();
    expect(element.querySelector('.quality-text')).toBeNull();
    expect(element.querySelector('.track-header-tags')).toBeNull();
    expect(getComputedStyle(page).scrollbarGutter).toBe('stable');
    expect(getComputedStyle(page, '::-webkit-scrollbar').width).toBe('6px');
  });
});
