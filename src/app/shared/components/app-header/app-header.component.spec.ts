import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { LIBRARY_GATEWAY, PLAYBACK_ENGINE, SETTINGS_GATEWAY, type LibraryGateway } from '../../../core/contracts';
import { MockPlaybackEngine, MockSettingsGateway } from '../../../core/mock';
import type { MusicFolder, ScanProgress } from '../../../core/models';
import { PlayerService } from '../../../core/player/player.service';
import { AppHeaderComponent } from './app-header.component';

describe('AppHeaderComponent', () => {
  let fixture: ComponentFixture<AppHeaderComponent>;
  let gateway: jasmine.SpyObj<LibraryGateway>;
  let progress: BehaviorSubject<ScanProgress>;

  beforeEach(async () => {
    progress = new BehaviorSubject<ScanProgress>({ isScanning: false, scannedFiles: 0, audioFiles: 0, currentPath: null });
    gateway = jasmine.createSpyObj<LibraryGateway>('LibraryGateway', [
      'getLibrary', 'getFolderTree', 'getTrackDetails', 'selectAndAddMusicFolders', 'removeMusicFolder', 'requestScan',
    ]);
    Object.defineProperty(gateway, 'scanProgress$', { value: progress.asObservable() });
    gateway.getLibrary.and.resolveTo({ tracks: [], albums: [], artists: [], folders: [] });
    gateway.selectAndAddMusicFolders.and.resolveTo([folder]);
    gateway.requestScan.and.resolveTo();
    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
      providers: [
        provideRouter([]),
        { provide: LIBRARY_GATEWAY, useValue: gateway },
        { provide: PLAYBACK_ENGINE, useClass: MockPlaybackEngine },
        { provide: SETTINGS_GATEWAY, useClass: MockSettingsGateway },
        PlayerService,
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AppHeaderComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders the integrated drag header and functional search control', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.app-header')).not.toBeNull();
    expect(element.querySelector('app-global-search input[role="combobox"]')).not.toBeNull();
    expect(element.querySelector('.runtime-status')).toBeNull();
    expect(element.querySelector('a.settings-button')).not.toBeNull();
    expect(getComputedStyle(element.querySelector('.app-header')!).getPropertyValue('-webkit-app-region')).toBe('drag');
  });

  it('centers the link-based Home and Settings controls', () => {
    const element = fixture.nativeElement as HTMLElement;
    const controls = [
      element.querySelector<HTMLElement>('a.home-button'),
      element.querySelector<HTMLElement>('a.settings-button'),
    ];

    for (const control of controls) {
      expect(control).not.toBeNull();
      const style = getComputedStyle(control!);
      expect(['flex', 'inline-flex']).toContain(style.display);
      expect(style.alignItems).toBe('center');
      expect(style.justifyContent).toBe('center');
      expect(style.padding).toBe('0px');
      expect(style.lineHeight).toBe('0px');
    }
  });

  it('keeps Settings out of the application menu', () => {
    fixture.componentInstance.toggleMenu();
    fixture.detectChanges();
    const menu = (fixture.nativeElement as HTMLElement).querySelector('.app-menu') as HTMLElement;
    expect(menu.textContent).not.toContain('Settings');
    expect(menu.textContent).toContain('Browser demo mode');
  });

  it('adds selected folders and starts a targeted scan', async () => {
    fixture.componentInstance.toggleMenu();
    await fixture.componentInstance.addMusicFolder();
    expect(gateway.selectAndAddMusicFolders).toHaveBeenCalled();
    expect(gateway.requestScan).toHaveBeenCalledWith([folder.id]);
    expect(fixture.componentInstance.menuOpen()).toBeFalse();
  });

  it('shows live scan progress and focuses search with Ctrl+K', () => {
    progress.next({ isScanning: true, scannedFiles: 42, audioFiles: 20, currentPath: 'D:\\Music' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Scanning · 42');

    fixture.componentInstance.onWindowKeyDown(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true }));
    const input = (fixture.nativeElement as HTMLElement).querySelector('app-global-search input') as HTMLInputElement;
    expect(document.activeElement).toBe(input);
  });

  it('shows scan errors without restoring the idle status badge', () => {
    progress.next({ isScanning: false, scannedFiles: 42, audioFiles: 20, currentPath: null, error: 'Folder unavailable' });
    fixture.detectChanges();
    const status = (fixture.nativeElement as HTMLElement).querySelector('.runtime-status') as HTMLElement;
    expect(status.textContent).toContain('Scan warning');
    expect(status.title).toBe('Folder unavailable');

    progress.next({ isScanning: false, scannedFiles: 42, audioFiles: 20, currentPath: null, error: null });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.runtime-status')).toBeNull();
  });
});

const folder: MusicFolder = { id: 'folder-test', path: 'D:\\Music', name: 'Music', addedAt: 1 };
