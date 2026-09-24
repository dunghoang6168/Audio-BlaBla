import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { LIBRARY_GATEWAY, PLAYBACK_ENGINE, PLAYLIST_GATEWAY, SETTINGS_GATEWAY } from './core/contracts';
import { MockLibraryGateway, MockPlaybackEngine, MockPlaylistGateway, MockSettingsGateway } from './core/mock';
import { RightPanelService } from './core/layout/right-panel.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter(routes),
        { provide: LIBRARY_GATEWAY, useClass: MockLibraryGateway },
        { provide: PLAYLIST_GATEWAY, useClass: MockPlaylistGateway },
        { provide: SETTINGS_GATEWAY, useClass: MockSettingsGateway },
        { provide: PLAYBACK_ENGINE, useClass: MockPlaybackEngine },
      ],
    }).compileComponents();
  });

  it('should create the app shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('uses the integrated app header instead of the old demo banner', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-header')).not.toBeNull();
    expect(element.querySelector('app-demo-banner')).toBeNull();
    expect(element.querySelectorAll('a[aria-label="Settings"]').length).toBe(1);
    expect(element.querySelector('app-sidebar a[title="Settings"]')).toBeNull();
  });

  it('should toggle sidebar collapsed state', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.isSidebarCollapsed()).toBeFalse();
    app.onToggleSidebar();
    expect(app.isSidebarCollapsed()).toBeTrue();
  });

  it('should toggle and close queue drawer', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.isQueueOpen()).toBeFalse();
    app.onToggleQueue();
    expect(app.isQueueOpen()).toBeTrue();
    app.onCloseQueue();
    expect(app.isQueueOpen()).toBeFalse();
  });

  it('opens only one right panel at a time', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const panels = TestBed.inject(RightPanelService);
    panels.openTrackDetails();
    expect(panels.isTrackDetailsOpen()).toBeTrue();
    app.onToggleQueue();
    expect(app.isQueueOpen()).toBeTrue();
    expect(panels.isTrackDetailsOpen()).toBeFalse();
  });
});
