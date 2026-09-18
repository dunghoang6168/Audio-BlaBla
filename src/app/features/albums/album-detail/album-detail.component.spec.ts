import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { EMPTY } from 'rxjs';
import { LIBRARY_GATEWAY } from '../../../core/contracts';
import { Track } from '../../../core/models';
import { PlayerService } from '../../../core/player/player.service';
import { AlbumDetailComponent } from './album-detail.component';

describe('AlbumDetailComponent playback order', () => {
  let fixture: ComponentFixture<AlbumDetailComponent>;
  let component: AlbumDetailComponent;
  let player: {
    currentTrack: ReturnType<typeof signal<Track | null>>;
    isShuffle: ReturnType<typeof signal<boolean>>;
    setShuffle: jasmine.Spy;
    playCollection: jasmine.Spy;
  };

  beforeEach(async () => {
    player = {
      currentTrack: signal<Track | null>(null),
      isShuffle: signal(false),
      setShuffle: jasmine.createSpy('setShuffle'),
      playCollection: jasmine.createSpy('playCollection'),
    };

    await TestBed.configureTestingModule({
      imports: [AlbumDetailComponent],
      providers: [
        { provide: PlayerService, useValue: player },
        {
          provide: LIBRARY_GATEWAY,
          useValue: {
            getLibrary: async () => ({ tracks: [], albums: [], artists: [], folders: [] }),
            scanProgress$: EMPTY,
          },
        },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AlbumDetailComponent);
    component = fixture.componentInstance;
    component.albumTracks.set([
      createTrack('track-3', 1, 3),
      createTrack('track-1', 1, 1),
      createTrack('disc-2-track-1', 2, 1),
      createTrack('track-2', 1, 2),
    ]);
  });

  it('creates an ordered queue and starts at the selected track', () => {
    component.onPlayTrack(component.albumTracks()[3]);

    expect(player.setShuffle).toHaveBeenCalledOnceWith(false);
    expect(player.playCollection).toHaveBeenCalledTimes(1);
    const [tracks, startIndex] = player.playCollection.calls.mostRecent().args as [Track[], number];
    expect(tracks.map((track) => track.id)).toEqual([
      'track-1',
      'track-2',
      'track-3',
      'disc-2-track-1',
    ]);
    expect(startIndex).toBe(1);
  });

  it('uses ordered mode for Play Album and shuffle mode only for Shuffle', () => {
    component.onPlayAll();
    expect(player.setShuffle).toHaveBeenCalledWith(false);
    expect(player.playCollection.calls.mostRecent().args[0].map((track: Track) => track.id)).toEqual([
      'track-1',
      'track-2',
      'track-3',
      'disc-2-track-1',
    ]);

    component.onShufflePlay();
    expect(player.setShuffle).toHaveBeenCalledWith(true);
  });
});

function createTrack(id: string, discNumber: number, trackNumber: number): Track {
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
    discNumber,
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
