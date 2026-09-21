import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { LIBRARY_GATEWAY, PLAYBACK_ENGINE, PLAYLIST_GATEWAY, SETTINGS_GATEWAY } from './core/contracts';
import { MockLibraryGateway, MockPlaybackEngine, MockPlaylistGateway, MockSettingsGateway } from './core/mock';
import { ElectronLibraryGateway } from './core/desktop/electron-library.gateway';
import { ElectronPlaylistGateway } from './core/desktop/electron-playlist.gateway';
import { ElectronSettingsGateway } from './core/desktop/electron-settings.gateway';
import { HtmlAudioPlaybackEngine } from './core/desktop/html-audio-playback.engine';
import { getDesktopApi } from './core/desktop/desktop-api';
import { ThemeService } from './core/theme/theme.service';

const isDesktop = () => Boolean(getDesktopApi());

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    { provide: LIBRARY_GATEWAY, useFactory: () => isDesktop() ? new ElectronLibraryGateway() : new MockLibraryGateway() },
    { provide: PLAYLIST_GATEWAY, useFactory: () => isDesktop() ? new ElectronPlaylistGateway() : new MockPlaylistGateway() },
    { provide: SETTINGS_GATEWAY, useFactory: () => isDesktop() ? new ElectronSettingsGateway() : new MockSettingsGateway() },
    { provide: PLAYBACK_ENGINE, useFactory: () => isDesktop() ? new HtmlAudioPlaybackEngine() : new MockPlaybackEngine() },
    provideAppInitializer(() => inject(ThemeService).restore()),
  ],
};
