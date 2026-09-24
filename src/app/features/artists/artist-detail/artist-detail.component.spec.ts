import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { EMPTY, Subject } from 'rxjs';
import { ARTIST_METADATA_GATEWAY, LIBRARY_GATEWAY } from '../../../core/contracts';
import { Album, Artist, ArtistMetadataUpdate, ArtistOnlineMetadata, Track } from '../../../core/models';
import { PlayerService } from '../../../core/player/player.service';
import { ArtistDetailComponent } from './artist-detail.component';

describe('ArtistDetailComponent album quick play', () => {
  let fixture: ComponentFixture<ArtistDetailComponent>;
  let component: ArtistDetailComponent;
  let router: Router;
  let metadataUpdates: Subject<ArtistMetadataUpdate>;
  let metadataGateway: {
    ensureArtist: jasmine.Spy;
    refreshArtist: jasmine.Spy;
    searchCandidates: jasmine.Spy;
    setArtistMatch: jasmine.Spy;
    setWikipediaOverride: jasmine.Spy;
    openSource: jasmine.Spy;
    selectCustomAvatar: jasmine.Spy;
    clearCustomAvatar: jasmine.Spy;
  };
  let player: {
    currentTrack: ReturnType<typeof signal<Track | null>>;
    setShuffle: jasmine.Spy;
    playCollection: jasmine.Spy;
  };

  const tracks = [
    createTrack('track-3', 3),
    createTrack('track-1', 1),
    createTrack('track-2', 2),
    createTrack('unrelated', 1),
  ];
  const album: Album = {
    id: 'album-1',
    title: 'Album One',
    artist: 'Artist One',
    year: 2026,
    artwork: null,
    trackIds: ['track-3', 'track-1', 'track-2'],
  };
  const artist: Artist = {
    id: 'artist-1',
    name: 'Artist One',
    albumIds: [album.id],
    trackIds: album.trackIds,
    onlineMetadata: null,
    customAvatar: null,
  };

  beforeEach(async () => {
    player = {
      currentTrack: signal<Track | null>(null),
      setShuffle: jasmine.createSpy('setShuffle'),
      playCollection: jasmine.createSpy('playCollection'),
    };
    metadataUpdates = new Subject<ArtistMetadataUpdate>();
    metadataGateway = {
      ensureArtist: jasmine.createSpy('ensureArtist').and.resolveTo(undefined),
      refreshArtist: jasmine.createSpy('refreshArtist').and.resolveTo(null),
      searchCandidates: jasmine.createSpy('searchCandidates').and.resolveTo([]),
      setArtistMatch: jasmine.createSpy('setArtistMatch').and.resolveTo(null),
      setWikipediaOverride: jasmine.createSpy('setWikipediaOverride').and.resolveTo(null),
      openSource: jasmine.createSpy('openSource').and.resolveTo(undefined),
      selectCustomAvatar: jasmine.createSpy('selectCustomAvatar').and.resolveTo(null),
      clearCustomAvatar: jasmine.createSpy('clearCustomAvatar').and.resolveTo(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [ArtistDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: artist.id }) } },
        },
        { provide: PlayerService, useValue: player },
        {
          provide: ARTIST_METADATA_GATEWAY,
          useFactory: () => ({ updates$: metadataUpdates, ...metadataGateway }),
        },
        {
          provide: LIBRARY_GATEWAY,
          useValue: {
            getLibrary: async () => ({
              tracks,
              albums: [album],
              artists: [artist],
              folders: [],
            }),
            scanProgress$: EMPTY,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ArtistDetailComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('stops card navigation, disables shuffle and plays the album in canonical order', () => {
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
    expect(player.playCollection.calls.mostRecent().args[1]).toBe(0);
  });

  it('ignores an album with no tracks while still stopping card navigation', () => {
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');

    component.onPlayAlbum(event, { ...album, trackIds: ['missing-track'] });

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(player.setShuffle).not.toHaveBeenCalled();
    expect(player.playCollection).not.toHaveBeenCalled();
  });

  it('renders an accessible play button that does not activate the album link', () => {
    const navigateSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.quick-play-btn');

    expect(button.title).toBe('Play Album One');
    expect(button.getAttribute('aria-label')).toBe('Play Album One');

    button.focus();

    expect(document.activeElement).toBe(button);

    button.click();

    expect(player.playCollection).toHaveBeenCalledTimes(1);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('keeps the rest of the album card linked to Album Detail', () => {
    const navigateSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const card: HTMLElement = fixture.nativeElement.querySelector('.album-card');

    card.click();

    expect(navigateSpy).toHaveBeenCalled();
  });

  it('hides About without content while keeping edit and retry actions available', async () => {
    expect(fixture.nativeElement.querySelector('.section-about')).toBeNull();
    expect(fixture.nativeElement.querySelector('.section-songs')).not.toBeNull();

    metadataUpdates.next({ artistId: artist.id, metadata: null, status: 'error', error: 'Metadata request failed (503)' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.section-about')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Metadata request failed (503)');
    const actions: HTMLButtonElement[] = [...fixture.nativeElement.querySelectorAll('.hero-actions button')];
    expect(actions.map((button) => button.textContent?.trim())).toEqual(['Play All Songs', 'Edit online info', 'Retry info']);

    actions[1].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.metadata-modal-card')).not.toBeNull();

    component.closeMetadataEditor();
    actions[2].click();
    await fixture.whenStable();
    expect(metadataGateway.refreshArtist).toHaveBeenCalledOnceWith(artist.id);
  });

  it('does not render About for avatar-only metadata, but keeps stale biography visible after a refresh error', () => {
    const metadata = createOnlineMetadata();
    metadataUpdates.next({ artistId: artist.id, metadata: { ...metadata, biography: null, aboutImage: null }, status: 'available' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.section-about')).toBeNull();

    metadataUpdates.next({ artistId: artist.id, metadata, status: 'available' });
    metadataUpdates.next({ artistId: artist.id, metadata, status: 'error', error: 'Offline' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.section-about')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.about-biography').textContent).toContain('Artist biography');
  });

  it('keeps the required Albums, About, Songs order and patches online data without reloading the library', () => {
    const metadata = createOnlineMetadata();

    metadataUpdates.next({ artistId: artist.id, metadata, status: 'available' });
    fixture.detectChanges();

    const sections = [...fixture.nativeElement.querySelectorAll('section')].map((node: Element) => node.className);
    expect(sections).toEqual(['section-albums', 'section-about', 'section-songs']);
    expect(fixture.nativeElement.querySelector('.artist-avatar-img').getAttribute('src')).toBe(metadata.avatar);
    expect(fixture.nativeElement.querySelector('.about-image').getAttribute('src')).toBe(metadata.aboutImage);
    expect(fixture.nativeElement.querySelector('.about-biography').textContent).toContain('Artist biography');
    expect(metadataGateway.ensureArtist).toHaveBeenCalledOnceWith(artist.id);
  });

  it('expands biography and opens only allowlisted source links through the gateway', () => {
    const metadata = createOnlineMetadata();
    metadataUpdates.next({ artistId: artist.id, metadata, status: 'available' });
    fixture.detectChanges();

    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.about-toggle');
    toggle.click();
    fixture.detectChanges();
    expect(component.biographyExpanded()).toBeTrue();
    expect(toggle.textContent).toContain('Show less');

    const source: HTMLButtonElement = fixture.nativeElement.querySelector('.about-sources button');
    source.click();
    expect(metadataGateway.openSource).toHaveBeenCalledWith(metadata.biographySourceUrl);
  });

  it('searches candidates and saves a manual MusicBrainz match with Wikipedia override', async () => {
    const candidate = {
      musicBrainzId: '12345678-1234-4234-9234-123456789abc',
      name: artist.name,
      aliases: [],
      type: 'Person',
      country: 'VN',
      disambiguation: 'Vietnamese singer',
      score: 100,
    };
    const metadata = createOnlineMetadata();
    metadataGateway.searchCandidates.and.resolveTo([candidate]);
    metadataGateway.setArtistMatch.and.resolveTo(metadata);
    metadataGateway.setWikipediaOverride.and.resolveTo(metadata);

    await component.openMetadataEditor();
    component.selectedCandidateId.set(candidate.musicBrainzId);
    component.wikipediaOverride.set('https://en.wikipedia.org/wiki/Artist_One');
    await component.saveMetadataMatch();
    fixture.detectChanges();

    expect(metadataGateway.searchCandidates).toHaveBeenCalledWith(artist.name);
    expect(metadataGateway.setArtistMatch).toHaveBeenCalledOnceWith(artist.id, candidate.musicBrainzId);
    expect(metadataGateway.setWikipediaOverride).toHaveBeenCalledOnceWith(artist.id, 'https://en.wikipedia.org/wiki/Artist_One');
    expect(component.showMetadataEditor()).toBeFalse();
    expect(component.artist()?.onlineMetadata).toEqual(metadata);
  });

  it('chooses and removes a custom hero avatar without changing About metadata', async () => {
    const metadata = createOnlineMetadata();
    metadataUpdates.next({ artistId: artist.id, metadata, status: 'available' });
    metadataGateway.selectCustomAvatar.and.resolveTo('music://artwork/custom-hash');

    await component.chooseCustomAvatar();
    fixture.detectChanges();
    expect(component.heroAvatar()).toBe('music://artwork/custom-hash');
    expect(component.artist()?.onlineMetadata?.aboutImage).toBe(metadata.aboutImage);

    await component.removeCustomAvatar();
    fixture.detectChanges();
    expect(component.heroAvatar()).toBe(metadata.avatar);
    expect(metadataGateway.clearCustomAvatar).toHaveBeenCalledOnceWith(artist.id);
  });
});

function createOnlineMetadata(): ArtistOnlineMetadata {
  return {
    musicBrainzId: '12345678-1234-4234-9234-123456789abc',
    matchMode: 'automatic',
    biography: `Artist biography ${'with enough detail to exercise the collapsed biography presentation. '.repeat(8)}`,
    biographySourceUrl: 'https://en.wikipedia.org/wiki/Artist_One',
    avatar: 'music://artwork/avatar-hash',
    avatarSourceUrl: 'https://upload.wikimedia.org/avatar.jpg',
    aboutImage: 'music://artwork/about-hash',
    aboutImageSourceUrl: 'https://www.theaudiodb.com/images/about.jpg',
    sources: ['musicbrainz', 'wikipedia', 'theaudiodb'],
    fetchedAt: Date.now(),
  };
}

function createTrack(id: string, trackNumber: number): Track {
  return {
    id,
    path: `C:\\Music\\${id}.flac`,
    fileName: `${id}.flac`,
    title: id,
    artist: 'Artist One',
    albumArtist: 'Artist One',
    album: 'Album One',
    genre: null,
    year: 2026,
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
