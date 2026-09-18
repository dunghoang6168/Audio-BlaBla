import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EMPTY } from 'rxjs';
import { LIBRARY_GATEWAY } from '../../core/contracts';
import { Album, Track } from '../../core/models';
import { PlayerService } from '../../core/player/player.service';
import { AlbumsComponent } from './albums.component';

describe('AlbumsComponent quick play', () => {
  let fixture: ComponentFixture<AlbumsComponent>;
  let component: AlbumsComponent;
  let player: {
    isShuffle: ReturnType<typeof signal<boolean>>;
    setShuffle: jasmine.Spy;
    playCollection: jasmine.Spy;
  };

  beforeEach(async () => {
    player = {
      isShuffle: signal(true),
      setShuffle: jasmine.createSpy('setShuffle'),
      playCollection: jasmine.createSpy('playCollection'),
    };

    await TestBed.configureTestingModule({
      imports: [AlbumsComponent],
      providers: [
        { provide: PlayerService, useValue: player },
        {
          provide: LIBRARY_GATEWAY,
          useValue: {
            getLibrary: async () => ({ tracks: [], albums: [], artists: [], folders: [] }),
            scanProgress$: EMPTY,
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
});

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
