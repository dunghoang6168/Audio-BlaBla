import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PlayerBarComponent } from './player-bar.component';
import { PlayerService } from '../../../core/player/player.service';
import { PLAYBACK_ENGINE, SETTINGS_GATEWAY } from '../../../core/contracts';
import { MockPlaybackEngine } from '../../../core/mock/mock-playback.engine';
import { MockSettingsGateway } from '../../../core/mock/mock-settings.gateway';

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
});
