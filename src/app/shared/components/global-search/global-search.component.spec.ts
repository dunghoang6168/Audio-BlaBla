import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { LIBRARY_GATEWAY, PLAYBACK_ENGINE, SETTINGS_GATEWAY, type LibraryGateway, type LibrarySnapshot } from '../../../core/contracts';
import { MockPlaybackEngine, MockSettingsGateway } from '../../../core/mock';
import type { ScanProgress, Track } from '../../../core/models';
import { PlayerService } from '../../../core/player/player.service';
import { GlobalSearchComponent } from './global-search.component';

@Component({ standalone: true, template: '' })
class SearchRouteComponent {}

describe('GlobalSearchComponent', () => {
  let fixture: ComponentFixture<GlobalSearchComponent>;
  let gateway: jasmine.SpyObj<LibraryGateway>;
  let player: PlayerService;

  beforeEach(async () => {
    const progress = new BehaviorSubject<ScanProgress>({ isScanning: false, scannedFiles: 0, audioFiles: 0, currentPath: null });
    gateway = jasmine.createSpyObj<LibraryGateway>('LibraryGateway', [
      'getLibrary', 'getFolderTree', 'getTrackDetails', 'selectAndAddMusicFolders', 'removeMusicFolder', 'requestScan',
    ]);
    Object.defineProperty(gateway, 'scanProgress$', { value: progress.asObservable() });
    gateway.getLibrary.and.resolveTo(snapshot);
    await TestBed.configureTestingModule({
      imports: [GlobalSearchComponent],
      providers: [
        provideRouter([
          { path: 'albums/:id', component: SearchRouteComponent },
          { path: 'artists/:id', component: SearchRouteComponent },
        ]),
        { provide: LIBRARY_GATEWAY, useValue: gateway },
        { provide: PLAYBACK_ENGINE, useClass: MockPlaybackEngine },
        { provide: SETTINGS_GATEWAY, useClass: MockSettingsGateway },
        PlayerService,
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(GlobalSearchComponent);
    player = TestBed.inject(PlayerService);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('searches case- and accent-insensitively and groups local results', async () => {
    fixture.componentInstance.openSearch();
    await fixture.whenStable();
    updateSearch(fixture, 'vu');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Songs');
    expect(text).toContain('Artists');
    expect(text).toContain('Vũ');
    expect(text).toContain('Bước Qua Nhau');
  });

  it('plays available songs and prevents unavailable songs from playing', async () => {
    const play = spyOn(player, 'playTrack').and.resolveTo();
    fixture.componentInstance.openSearch();
    await fixture.whenStable();
    updateSearch(fixture, 'buoc');
    const available = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.result-item:not(.unavailable)')!;
    available.click();
    expect(play).toHaveBeenCalledWith(snapshot.tracks[0]);
    await fixture.whenStable();

    fixture.componentInstance.openSearch();
    await fixture.whenStable();
    updateSearch(fixture, 'missing');
    const unavailable = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.result-item.unavailable')!;
    unavailable.click();
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('navigates to album results', async () => {
    fixture.componentInstance.openSearch();
    await fixture.whenStable();
    updateSearch(fixture, 'mot van nam');
    const album = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.result-item'))
      .find((button) => button.querySelector('.result-type')?.textContent?.trim() === 'album')!;
    album.click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/albums/album-vu');
  });

  it('moves through selectable results with the keyboard', async () => {
    fixture.componentInstance.openSearch();
    await fixture.whenStable();
    updateSearch(fixture, 'vu');
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input')!;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/albums/album-vu');
  });

  it('ignores a stale library response from an earlier request', async () => {
    const first = deferred<LibrarySnapshot>();
    const second = deferred<LibrarySnapshot>();
    gateway.getLibrary.and.returnValues(first.promise, second.promise);
    fixture.componentInstance.openSearch();
    fixture.componentInstance.reload();

    second.resolve({ ...snapshot, tracks: [{ ...availableTrack, title: 'Fresh Result' }] });
    await second.promise;
    await Promise.resolve();
    updateSearch(fixture, 'fresh');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Fresh Result');

    first.resolve({ ...snapshot, tracks: [{ ...availableTrack, title: 'Stale Result' }] });
    await first.promise;
    await Promise.resolve();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Stale Result');
  });
});

function updateSearch(fixture: ComponentFixture<GlobalSearchComponent>, value: string): void {
  const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input')!;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  fixture.detectChanges();
}

function deferred<T>(): { promise: Promise<T>; resolve(value: T): void } {
  let resolve!: (value: T) => void;
  return { promise: new Promise<T>((complete) => { resolve = complete; }), resolve };
}

const availableTrack: Track = {
  id: 'track-vu', path: 'D:\\Music\\Buoc Qua Nhau.flac', fileName: 'Buoc Qua Nhau.flac', title: 'Bước Qua Nhau',
  artist: 'Vũ', albumArtist: 'Vũ', album: 'Một Vạn Năm', genre: null, year: 2022, trackNumber: 1, discNumber: 1,
  duration: 240, codec: 'FLAC', bitrate: null, sampleRate: 44100, bitDepth: 16, channels: 2,
  artwork: null, fileSize: null, lastModified: null, isAvailable: true,
};

const snapshot: LibrarySnapshot = {
  tracks: [availableTrack, { ...availableTrack, id: 'track-missing', title: 'Missing Song', isAvailable: false }],
  albums: [{ id: 'album-vu', title: 'Một Vạn Năm', artist: 'Vũ', year: 2022, artwork: null, trackIds: ['track-vu'] }],
  artists: [{ id: 'artist-vu', name: 'Vũ', albumIds: ['album-vu'], trackIds: ['track-vu'], onlineMetadata: null, customAvatar: null }],
  folders: [],
};
