import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EMPTY } from 'rxjs';
import { LIBRARY_GATEWAY, PLAYLIST_GATEWAY } from '../../core/contracts';
import { Album } from '../../core/models';
import { PlayerService } from '../../core/player/player.service';
import { HomeComponent, featuredAlbumColumns } from './home.component';

describe('HomeComponent featured albums', () => {
  it('fills exactly one row for three, four and five column widths', () => {
    expect(featuredAlbumColumns(512)).toBe(3);
    expect(featuredAlbumColumns(688)).toBe(4);
    expect(featuredAlbumColumns(864)).toBe(5);
    expect(featuredAlbumColumns(120)).toBe(1);
  });

  it('uses the same title order as Albums and expands with the available columns', async () => {
    const albums: Album[] = ['Zulu', 'Alpha', '2', 'Beta', 'Gamma', 'Delta'].map((title, index) => ({
      id: String(index), title, artist: 'Artist', year: 2024, artwork: null, trackIds: [],
    }));
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: LIBRARY_GATEWAY, useValue: { getLibrary: async () => ({ tracks: [], albums, artists: [], folders: [] }), scanProgress$: EMPTY } },
        { provide: PLAYLIST_GATEWAY, useValue: { getPlaylists: async () => [] } },
        { provide: PlayerService, useValue: { currentTrack: signal(null), playCollection: jasmine.createSpy('playCollection') } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.featuredColumnCount.set(3);
    expect(component.featuredAlbums().map((album) => album.title)).toEqual(['2', 'Alpha', 'Beta']);
    component.featuredColumnCount.set(4);
    expect(component.featuredAlbums().map((album) => album.title)).toEqual(['2', 'Alpha', 'Beta', 'Delta']);
    component.featuredColumnCount.set(5);
    expect(component.featuredAlbums().map((album) => album.title)).toEqual(['2', 'Alpha', 'Beta', 'Delta', 'Gamma']);
  });
});
