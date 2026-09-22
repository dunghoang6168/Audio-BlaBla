import { ApplicationConfig, inject, InjectionToken, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { AUDIO_ANALYSIS_ENGINE, AudioAnalysisEngine, LIBRARY_GATEWAY, PLAYBACK_ENGINE, PlaybackEngine, PLAYLIST_GATEWAY, SETTINGS_GATEWAY } from './core/contracts';
import { MockLibraryGateway, MockPlaybackEngine, MockPlaylistGateway, MockSettingsGateway } from './core/mock';
import { ElectronLibraryGateway } from './core/desktop/electron-library.gateway';
import { ElectronPlaylistGateway } from './core/desktop/electron-playlist.gateway';
import { ElectronSettingsGateway } from './core/desktop/electron-settings.gateway';
import { HtmlAudioPlaybackEngine } from './core/desktop/html-audio-playback.engine';
import { getDesktopApi } from './core/desktop/desktop-api';
import { ThemeService } from './core/theme/theme.service';

const isDesktop = () => Boolean(getDesktopApi());
const ACTIVE_AUDIO_ENGINE = new InjectionToken<PlaybackEngine & AudioAnalysisEngine>('ACTIVE_AUDIO_ENGINE');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    { provide: LIBRARY_GATEWAY, useFactory: () => isDesktop() ? new ElectronLibraryGateway() : new MockLibraryGateway() },
    { provide: PLAYLIST_GATEWAY, useFactory: () => isDesktop() ? new ElectronPlaylistGateway() : new MockPlaylistGateway() },
    { provide: SETTINGS_GATEWAY, useFactory: () => isDesktop() ? new ElectronSettingsGateway() : new MockSettingsGateway() },
    { provide: ACTIVE_AUDIO_ENGINE, useFactory: () => isDesktop() ? new HtmlAudioPlaybackEngine() : new MockPlaybackEngine() },
    { provide: PLAYBACK_ENGINE, useExisting: ACTIVE_AUDIO_ENGINE },
    { provide: AUDIO_ANALYSIS_ENGINE, useExisting: ACTIVE_AUDIO_ENGINE },
    provideAppInitializer(() => inject(ThemeService).restore()),
  ],
};
