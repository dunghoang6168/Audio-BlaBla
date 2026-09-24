import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { LIBRARY_GATEWAY } from '../../core/contracts';
import { Track } from '../../core/models';
import { PlayerService } from '../../core/player/player.service';
import { SongsComponent } from './songs.component';

describe('SongsComponent browsing', () => {
  let fixture: ComponentFixture<SongsComponent>;
  let component: SongsComponent;
  let getLibrary: jasmine.Spy;
  let scanProgress: Subject<{ isScanning: boolean }>;

  beforeEach(async () => {
    scanProgress = new Subject();
    getLibrary = jasmine.createSpy('getLibrary').and.resolveTo({ tracks: [], albums: [], artists: [], folders: [] });
    await TestBed.configureTestingModule({
      imports: [SongsComponent],
      providers: [
        { provide: LIBRARY_GATEWAY, useValue: { getLibrary, scanProgress$: scanProgress } },
        { provide: PlayerService, useValue: { currentTrack: signal(null), isPlaying: signal(false), isShuffle: signal(false), playCollection: jasmine.createSpy('playCollection') } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SongsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('sorts titles naturally and uses stable ties for text and numeric columns', () => {
    const tracks = [
      createTrack('ten', '10', 'Beta', 'B', 2024, 20, 48000),
      createTrack('two-b', '2', 'Alpha', 'A', 2020, 40, null),
      createTrack('two-a', '2', 'Alpha', 'A', 2022, 30, 96000),
    ];
    component.tracks.set(tracks);
    expect(trackIds(component)).toEqual(['two-a', 'two-b', 'ten']);
    component.sortDirection.set('desc');
    expect(trackIds(component)).toEqual(['ten', 'two-a', 'two-b']);
    component.sortColumn.set('artist');
    component.sortDirection.set('asc');
    expect(trackIds(component)).toEqual(['two-a', 'two-b', 'ten']);
    component.sortColumn.set('duration');
    expect(trackIds(component)).toEqual(['ten', 'two-a', 'two-b']);
    component.sortColumn.set('sampleRate');
    component.sortDirection.set('desc');
    expect(trackIds(component)).toEqual(['two-a', 'ten', 'two-b']);
    expect(component.tracks()).toEqual(tracks);
  });

  it('combines search, artist, album and year filters including unknown year', () => {
    component.tracks.set([
      createTrack('a', 'Match One', 'Artist', 'Album', null, 20, null),
      createTrack('b', 'Match Two', 'Artist', 'Album', 2024, 20, null),
      createTrack('c', 'Match Three', 'Other', 'Album', null, 20, null),
    ]);
    component.searchQuery.set('match');
    component.artistFilter.set('Artist');
    component.albumFilter.set('Album');
    component.yearFilter.set('unknown');
    expect(trackIds(component)).toEqual(['a']);
    expect(component.activeFilterCount()).toBe(3);
    component.yearFilter.set('2020');
    fixture.detectChanges();
    expect(trackIds(component)).toEqual([]);
    expect(fixture.nativeElement.querySelector('.empty-title').textContent).toContain('No songs found');
    component.clearFilters();
    expect(trackIds(component)).toEqual(['a', 'c', 'b']);
    expect(component.searchQuery()).toBe('match');
  });

  it('synchronizes column clicks with the popover and keeps choices after a scan', async () => {
    component.tracks.set([createTrack('a', 'Song', 'Artist', 'Album', 2024, 20, null)]);
    fixture.detectChanges();
    const sortButton: HTMLButtonElement = fixture.nativeElement.querySelector('.filter-trigger');
    sortButton.click();
    fixture.detectChanges();
    const sortSelect: HTMLSelectElement = fixture.nativeElement.querySelector('#song-sort');
    expect(sortSelect.value).toBe('title');
    component.toggleSort('album');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(sortSelect.value).toBe('album');
    component.artistFilter.set('Artist');
    component.yearFilter.set('2024');
    getLibrary.and.resolveTo({ tracks: [createTrack('a', 'Song', 'Artist', 'Album', 2024, 20, null)], albums: [], artists: [], folders: [] });
    scanProgress.next({ isScanning: true });
    scanProgress.next({ isScanning: false });
    await fixture.whenStable();
    expect(getLibrary).toHaveBeenCalledTimes(2);
    expect([component.sortColumn(), component.artistFilter(), component.yearFilter()]).toEqual(['album', 'Artist', '2024']);
    expect(trackIds(component)).toEqual(['a']);
  });
});

function trackIds(component: SongsComponent): string[] {
  return component.filteredTracks().map((track) => track.id);
}

function createTrack(id: string, title: string, artist: string | null, album: string | null, year: number | null, duration: number, sampleRate: number | null): Track {
  return {
    id, title, artist, album, year, duration, sampleRate,
    path: id, fileName: id, albumArtist: artist, genre: null, trackNumber: null, discNumber: null,
    codec: 'FLAC', bitrate: null, bitDepth: null, channels: null, artwork: null,
    fileSize: null, lastModified: null, isAvailable: true,
  };
}
