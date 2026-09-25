import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { LIBRARY_GATEWAY } from '../../core/contracts';
import { Album, Track } from '../../core/models';
import { PlayerService } from '../../core/player/player.service';
import { AlbumsComponent } from './albums.component';

describe('AlbumsComponent quick play', () => {
  let fixture: ComponentFixture<AlbumsComponent>;
  let component: AlbumsComponent;
  let getLibrary: jasmine.Spy;
  let scanProgress: Subject<{ isScanning: boolean }>;
  let player: {
    isShuffle: ReturnType<typeof signal<boolean>>;
    setShuffle: jasmine.Spy;
    playCollection: jasmine.Spy;
  };

  beforeEach(async () => {
    scanProgress = new Subject<{ isScanning: boolean }>();
    getLibrary = jasmine.createSpy('getLibrary').and.resolveTo({ tracks: [], albums: [], artists: [], folders: [] });
    player = {
      isShuffle: signal(true),
      setShuffle: jasmine.createSpy('setShuffle'),
      playCollection: jasmine.createSpy('playCollection'),
    };

    await TestBed.configureTestingModule({
      imports: [AlbumsComponent],
      providers: [
        provideRouter([]),
        { provide: PlayerService, useValue: player },
        {
          provide: LIBRARY_GATEWAY,
          useValue: {
            getLibrary,
            scanProgress$: scanProgress,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AlbumsComponent);
    component = fixture.componentInstance;
  });

  it('creates an ordered queue and disables shuffle', () => {
    const tracks = [createTrack('track-3', 3), createTrack('track-1', 1), createTrack('track-2', 2)];
    const album: Album = {
      id: 'album',
      title: 'Album',
      artist: 'Artist',
      year: null,
      artwork: null,
      trackIds: tracks.map((track) => track.id),
    };
    component.allTracks.set(tracks);
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');

    component.onPlayAlbum(event, album);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(player.setShuffle).toHaveBeenCalledOnceWith(false);
    expect(player.playCollection.calls.mostRecent().args[0].map((track: Track) => track.id)).toEqual([
      'track-1',
      'track-2',
      'track-3',
    ]);
  });

  it('sorts albums by title by default, then by artist, year and track count in both directions', () => {
    const albums = [
      createAlbum('z', 'Zulu', 'Beta', 2020, 2),
      createAlbum('a', 'Alpha', 'Zeta', null, 1),
      createAlbum('b', 'Beta', 'Alpha', 2024, 3),
      createAlbum('a2', 'Alpha', 'Alpha', 2022, 2),
    ];
    component.albums.set(albums);
    expect(albumIds(component)).toEqual(['a', 'a2', 'b', 'z']);
    component.sortDirection.set('desc');
    expect(albumIds(component)).toEqual(['z', 'b', 'a', 'a2']);
    component.sortDirection.set('asc');
    component.sortBy.set('artist');
    expect(albumIds(component)).toEqual(['a2', 'b', 'z', 'a']);
    component.sortBy.set('year');
    expect(albumIds(component)).toEqual(['z', 'a2', 'b', 'a']);
    component.sortDirection.set('desc');
    expect(albumIds(component)).toEqual(['b', 'a2', 'z', 'a']);
    component.sortBy.set('tracks');
    expect(albumIds(component)).toEqual(['b', 'a2', 'z', 'a']);
    expect(component.albums()).toEqual(albums);
  });

  it('combines search and filters, includes unknown year and clears conditions', () => {
    component.albums.set([
      createAlbum('one', 'First', 'Artist', 2024, 1),
      createAlbum('two', 'Second', 'Artist', null, 1),
      createAlbum('three', 'Second', 'Other', null, 1),
    ]);
    component.searchQuery.set('second');
    component.artistFilter.set('Artist');
    component.yearFilter.set('unknown');
    expect(albumIds(component)).toEqual(['two']);
    expect(component.yearOptions()).toEqual([2024]);
    component.yearFilter.set('2024');
    expect(albumIds(component)).toEqual([]);
    component.clearFilters();
    expect(albumIds(component)).toEqual(['three', 'two']);
    component.searchQuery.set('');
    expect(albumIds(component)).toEqual(['one', 'three', 'two']);
  });

  it('keeps browse choices when the library reloads after a scan', async () => {
    getLibrary.and.resolveTo({ tracks: [], albums: [createAlbum('one', 'First', 'Artist', 2024, 1)], artists: [], folders: [] });
    fixture.detectChanges();
    await fixture.whenStable();
    component.sortBy.set('year');
    component.sortDirection.set('desc');
    component.artistFilter.set('Artist');
    component.yearFilter.set('2024');
    component.searchQuery.set('First');
    scanProgress.next({ isScanning: true });
    scanProgress.next({ isScanning: false });
    await fixture.whenStable();
    expect(getLibrary).toHaveBeenCalledTimes(2);
    expect(albumIds(component)).toEqual(['one']);
    expect([component.sortBy(), component.sortDirection(), component.artistFilter(), component.yearFilter(), component.searchQuery()]).toEqual(['year', 'desc', 'Artist', '2024', 'First']);
    component.albums.set([]);
    expect(component.artistOptions()).toContain('Artist');
    expect(component.yearOptions()).toContain(2024);
    expect(albumIds(component)).toEqual([]);
  });
  it('applies the searchable artist choice without changing sort', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.albums.set([
      createAlbum('one', 'First', 'Artist One', 2024, 1),
      createAlbum('two', 'Second', 'Artist Two', 2024, 1),
    ]);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.filter-trigger') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('app-searchable-filter-select .select-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    const target = [...fixture.nativeElement.querySelectorAll('app-searchable-filter-select .option-item')]
      .find((item: Element) => item.textContent?.includes('Artist Two')) as HTMLButtonElement;
    target.click();
    expect(component.artistFilter()).toBe('Artist Two');
    expect(albumIds(component)).toEqual(['two']);
    expect(component.sortBy()).toBe('title');
  });
});

function createAlbum(id: string, title: string, artist: string, year: number | null, tracks: number): Album {
  return { id, title, artist, year, artwork: null, trackIds: Array.from({ length: tracks }, (_, index) => `${id}-${index}`) };
}

function albumIds(component: AlbumsComponent): string[] {
  return component.filteredAlbums().map((album) => album.id);
}

function createTrack(id: string, trackNumber: number): Track {
  return {
    id,
    path: `C:\\Music\\${id}.flac`,
    fileName: `${id}.flac`,
    title: id,
    artist: 'Artist',
    albumArtist: 'Artist',
    album: 'Album',
    genre: null,
    year: null,
    trackNumber,
    discNumber: 1,
    duration: 60,
    codec: 'FLAC',
    bitrate: null,
    sampleRate: null,
    bitDepth: null,
    channels: null,
    artwork: null,
    fileSize: null,
    lastModified: null,
    isAvailable: true,
  };
}
