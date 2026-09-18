import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PlayerBarComponent } from './player-bar.component';
import { PlayerService } from '../../../core/player/player.service';
import { PLAYBACK_ENGINE, SETTINGS_GATEWAY } from '../../../core/contracts';
import { MockPlaybackEngine } from '../../../core/mock/mock-playback.engine';
import { MockSettingsGateway } from '../../../core/mock/mock-settings.gateway';
import { Track } from '../../../core/models';

const testTrack: Track = {
  id: 'track-test', path: 'D:/Music/test.flac', fileName: 'test.flac', title: 'Test', artist: null,
  albumArtist: null, album: null, genre: null, year: null, trackNumber: null, discNumber: null,
  duration: 100, codec: 'FLAC', bitrate: null, sampleRate: 44100, bitDepth: 16, channels: 2,
  artwork: null, fileSize: null, lastModified: null, isAvailable: true,
};

describe('PlayerBarComponent (Keyboard & Controls)', () => {
  let component: PlayerBarComponent;
  let fixture: ComponentFixture<PlayerBarComponent>;
  let playerService: PlayerService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerBarComponent],
      providers: [
        provideRouter([]),
        { provide: PLAYBACK_ENGINE, useClass: MockPlaybackEngine },
        { provide: SETTINGS_GATEWAY, useClass: MockSettingsGateway },
        PlayerService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerBarComponent);
    component = fixture.componentInstance;
    playerService = TestBed.inject(PlayerService);
    fixture.detectChanges();
  });

  it('should create the player bar component', () => {
    expect(component).toBeTruthy();
  });

  it('should keep the play button aligned to the same size as transport buttons', () => {
    const controlButton = fixture.nativeElement.querySelector('.ctrl-btn') as HTMLButtonElement;
    const playButton = fixture.nativeElement.querySelector('.play-pause-btn') as HTMLButtonElement;

    expect(getComputedStyle(controlButton).width).toBe('32px');
    expect(getComputedStyle(controlButton).height).toBe('32px');
    expect(getComputedStyle(playButton).width).toBe('32px');
    expect(getComputedStyle(playButton).height).toBe('32px');
  });

  it('should toggle play/pause on global Space key when focus is not on interactive elements', () => {
    const toggleSpy = spyOn(playerService, 'togglePlayPause');
    const event = new KeyboardEvent('keydown', { code: 'Space', cancelable: true });
    const preventDefaultSpy = spyOn(event, 'preventDefault');

    // Focus is on body (default)
    component.onGlobalKeyDown(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(toggleSpy).toHaveBeenCalled();
  });

  it('should NOT toggle playback or preventDefault on Space key when focus is on a button', () => {
    const toggleSpy = spyOn(playerService, 'togglePlayPause');
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();

    const event = new KeyboardEvent('keydown', { code: 'Space', cancelable: true });
    const preventDefaultSpy = spyOn(event, 'preventDefault');

    component.onGlobalKeyDown(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
    expect(toggleSpy).not.toHaveBeenCalled();

    document.body.removeChild(button);
  });

  it('should NOT toggle playback on Space key when focus is on an input or textarea', () => {
    const toggleSpy = spyOn(playerService, 'togglePlayPause');
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', { code: 'Space', cancelable: true });
    const preventDefaultSpy = spyOn(event, 'preventDefault');

    component.onGlobalKeyDown(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
    expect(toggleSpy).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('should seek on pointer press and drag', () => {
    playerService.currentTrack.set(testTrack);
    playerService.duration.set(100);
    fixture.detectChanges();
    const timeline = fixture.nativeElement.querySelector('.progress-bar-wrap') as HTMLElement;
    spyOn(timeline, 'getBoundingClientRect').and.returnValue({ left: 10, width: 200 } as DOMRect);
    const seekSpy = spyOn(playerService, 'seek');

    component.onTimelinePointerDown(pointerEvent(timeline, 110));
    component.onTimelinePointerMove(pointerEvent(timeline, 170));
    component.onTimelinePointerUp(pointerEvent(timeline, 210));

    expect(seekSpy.calls.allArgs()).toEqual([[50], [80], [100]]);
  });

  it('should seek with keyboard and clamp at track boundaries', () => {
    playerService.currentTrack.set(testTrack);
    playerService.duration.set(100);
    playerService.currentTime.set(98);
    const seekSpy = spyOn(playerService, 'seek');
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });

    component.onTimelineKeyDown(event);

    expect(event.defaultPrevented).toBeTrue();
    expect(seekSpy).toHaveBeenCalledWith(100);
  });

  it('should render a normal pause icon while playback is loading', async () => {
    const pendingPlay = playerService.playTrack(testTrack);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.play-pause-btn') as HTMLButtonElement;

    expect(button.querySelector('.btn-spinner')).toBeNull();
    expect(button.getAttribute('aria-label')).toBe('Pause');

    await playerService.togglePlayPause();
    fixture.detectChanges();
    expect(button.getAttribute('aria-label')).toBe('Play');
    await pendingPlay;
  });
});

function pointerEvent(target: HTMLElement, clientX: number): PointerEvent {
  return {
    currentTarget: target,
    clientX,
    pointerId: 1,
    preventDefault: () => undefined,
  } as unknown as PointerEvent;
}
