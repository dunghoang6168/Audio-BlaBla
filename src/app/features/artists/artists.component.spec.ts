import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { ARTIST_METADATA_GATEWAY, LIBRARY_GATEWAY } from '../../core/contracts';
import { Artist, ArtistMetadataUpdate, ArtistOnlineMetadata, Track } from '../../core/models';
import { PlayerService } from '../../core/player/player.service';
import { ArtistsComponent } from './artists.component';

describe('ArtistsComponent online metadata', () => {
  let fixture: ComponentFixture<ArtistsComponent>;
  let updates: Subject<ArtistMetadataUpdate>;
  let scanProgress: Subject<{ isScanning: boolean }>;
  let getLibrary: jasmine.Spy;
  let refreshMissing: jasmine.Spy;

  const artist: Artist = {
    id: 'artist-1',
    name: 'Artist One',
    albumIds: [],
    trackIds: [],
    onlineMetadata: null,
    customAvatar: null,
  };

  beforeEach(async () => {
    updates = new Subject<ArtistMetadataUpdate>();
    scanProgress = new Subject<{ isScanning: boolean }>();
    getLibrary = jasmine.createSpy('getLibrary').and.resolveTo({ tracks: [], albums: [], artists: [artist], folders: [] });
    refreshMissing = jasmine.createSpy('refreshMissing').and.resolveTo(undefined);

    await TestBed.configureTestingModule({
      imports: [ArtistsComponent],
      providers: [
        provideRouter([]),
        { provide: LIBRARY_GATEWAY, useValue: { getLibrary, scanProgress$: scanProgress } },
        { provide: PlayerService, useValue: { currentTrack: signal(null), setShuffle: jasmine.createSpy('setShuffle'), playCollection: jasmine.createSpy('playCollection') } },
        {
          provide: ARTIST_METADATA_GATEWAY,
          useValue: {
            updates$: updates,
            refreshMissing,
            ensureArtist: async () => undefined,
            refreshArtist: async () => null,
            searchCandidates: async () => [],
            setArtistMatch: async () => null,
            setWikipediaOverride: async () => null,
            selectCustomAvatar: async () => null,
            clearCustomAvatar: async () => undefined,
            openSource: async () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ArtistsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('starts background refresh and keeps the initial fallback avatar', () => {
    expect(refreshMissing).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('.initial').textContent).toContain('A');
    expect(fixture.nativeElement.querySelector('.artist-avatar-img')).toBeNull();
  });

  it('plays artist albums in release order with shuffle disabled', () => {
    const component = fixture.componentInstance;
    const player = TestBed.inject(PlayerService);
    const older = { id: 'older', title: 'Older', artist: artist.name, year: 2020, artwork: null, trackIds: ['older-2', 'older-1'] };
    const newer = { id: 'newer', title: 'Newer', artist: artist.name, year: 2024, artwork: null, trackIds: ['newer-1'] };
    const tracks = [makeTrack('newer-1', 1), makeTrack('older-2', 2), makeTrack('older-1', 1)];
    const playableArtist = { ...artist, albumIds: ['newer', 'older'], trackIds: tracks.map((track) => track.id) };
    component.allAlbums.set([newer, older]);
    component.allTracks.set(tracks);

    component.onPlayArtist(new MouseEvent('click'), playableArtist);

    expect(player.setShuffle).toHaveBeenCalledOnceWith(false);
    expect(player.playCollection).toHaveBeenCalledOnceWith([tracks[2], tracks[1], tracks[0]], 0);
  });

  it('patches one card from an update without reloading or resetting search', () => {
    fixture.componentInstance.searchQuery.set('Artist');
    const metadata = createMetadata();

    updates.next({ artistId: artist.id, metadata, status: 'available' });
    fixture.detectChanges();

    expect(getLibrary).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.searchQuery()).toBe('Artist');
    expect(fixture.nativeElement.querySelector('.artist-avatar-img').getAttribute('src')).toBe(metadata.avatar);
  });

  it('refreshes missing info without reloading the grid', async () => {
    fixture.componentInstance.searchQuery.set('Artist');
    await fixture.componentInstance.refreshMissingInfo();
    expect(refreshMissing).toHaveBeenCalledWith(true);
    expect(getLibrary).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.searchQuery()).toBe('Artist');
  });

  it('falls back to the initial if a cached avatar fails to render', () => {
    updates.next({ artistId: artist.id, metadata: createMetadata(), status: 'available' });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.artist-avatar-img').dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.artist-avatar-img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.initial').textContent).toContain('A');
  });

  it('sorts by name by default and by album or track count in both directions', () => {
    const artists = [
      createArtist('z', 'Zed', 1, 2),
      createArtist('b', 'Beta', 3, 1),
      createArtist('a2', 'Alpha', 2, 4),
      createArtist('a', 'Alpha', 1, 2),
    ];
    fixture.componentInstance.artists.set(artists);
    expect(artistIds(fixture)).toEqual(['a', 'a2', 'b', 'z']);
    fixture.componentInstance.sortDirection.set('desc');
    expect(artistIds(fixture)).toEqual(['z', 'b', 'a', 'a2']);
    fixture.componentInstance.sortBy.set('albums');
    fixture.componentInstance.sortDirection.set('asc');
    expect(artistIds(fixture)).toEqual(['a', 'z', 'a2', 'b']);
    fixture.componentInstance.sortDirection.set('desc');
    expect(artistIds(fixture)).toEqual(['b', 'a2', 'a', 'z']);
    fixture.componentInstance.sortBy.set('tracks');
    expect(artistIds(fixture)).toEqual(['a2', 'a', 'z', 'b']);
    expect(fixture.componentInstance.artists()).toEqual(artists);
  });

  it('groups accented initials and Đ, combines search, and shows an empty result', () => {
    fixture.componentInstance.artists.set([
      createArtist('d', 'Đen', 1, 1),
      createArtist('da', 'Đạt', 1, 1),
      createArtist('e', 'Émile', 1, 1),
      createArtist('digit', '2Pac', 1, 1),
      createArtist('symbol', '!Band', 1, 1),
    ]);
    expect(fixture.componentInstance.initialOptions()).toEqual(['D', 'E', '#']);
    fixture.componentInstance.initialFilter.set('D');
    fixture.componentInstance.searchQuery.set('Đen');
    expect(artistIds(fixture)).toEqual(['d']);
    fixture.componentInstance.searchQuery.set('missing');
    fixture.detectChanges();
    expect(artistIds(fixture)).toEqual([]);
    expect(fixture.nativeElement.querySelector('.empty-title').textContent).toContain('No artists found');
    fixture.componentInstance.searchQuery.set('');
    fixture.componentInstance.initialFilter.set('#');
    expect(artistIds(fixture)).toEqual(['symbol', 'digit']);
    fixture.componentInstance.clearFilters();
    expect(artistIds(fixture).length).toBe(5);
  });

  it('preserves sort and filters through metadata updates and scan reloads', async () => {
    const component = fixture.componentInstance;
    component.sortBy.set('tracks');
    component.sortDirection.set('desc');
    component.initialFilter.set('A');
    component.searchQuery.set('Artist');
    updates.next({ artistId: artist.id, metadata: createMetadata(), status: 'available' });
    getLibrary.and.resolveTo({ tracks: [], albums: [], artists: [artist], folders: [] });
    scanProgress.next({ isScanning: true });
    scanProgress.next({ isScanning: false });
    await fixture.whenStable();
    expect(getLibrary).toHaveBeenCalledTimes(2);
    expect(artistIds(fixture)).toEqual(['artist-1']);
    expect([component.sortBy(), component.sortDirection(), component.initialFilter(), component.searchQuery()]).toEqual(['tracks', 'desc', 'A', 'Artist']);
    component.artists.set([]);
    expect(component.initialOptions()).toContain('A');
    expect(artistIds(fixture)).toEqual([]);
  });
});

function createArtist(id: string, name: string, albums: number, tracks: number): Artist {
  return {
    id, name, onlineMetadata: null, customAvatar: null,
    albumIds: Array.from({ length: albums }, (_, index) => `${id}-album-${index}`),
    trackIds: Array.from({ length: tracks }, (_, index) => `${id}-track-${index}`),
  };
}

function artistIds(fixture: ComponentFixture<ArtistsComponent>): string[] {
  return fixture.componentInstance.filteredArtists().map((artist) => artist.id);
}

function makeTrack(id: string, trackNumber: number): Track {
  return {
    id, path: id, fileName: id, title: id, artist: 'Artist One', albumArtist: 'Artist One',
    album: null, genre: null, year: null, trackNumber, discNumber: 1, duration: 1,
    codec: null, bitrate: null, sampleRate: null, bitDepth: null, channels: null,
    artwork: null, fileSize: null, lastModified: null, isAvailable: true,
  };
}

function createMetadata(): ArtistOnlineMetadata {
  return {
    musicBrainzId: '12345678-1234-4234-9234-123456789abc',
    matchMode: 'automatic',
    biography: null,
    biographySourceUrl: null,
    avatar: 'music://artwork/avatar-hash',
    avatarSourceUrl: 'https://upload.wikimedia.org/avatar.jpg',
    aboutImage: null,
    aboutImageSourceUrl: null,
    sources: ['musicbrainz', 'wikipedia'],
    fetchedAt: Date.now(),
  };
}
