import { Album, Artist, Track } from '../../core/models';
import { orderArtistTracks } from './artist-play-order';

describe('orderArtistTracks', () => {
  const artist: Artist = {
    id: 'artist', name: 'Artist', albumIds: ['new', 'unknown', 'old'],
    trackIds: ['new-2', 'old-2', 'unknown-1', 'old-1', 'new-1', 'orphan'],
    onlineMetadata: null, customAvatar: null,
  };
  const albums: Album[] = [
    { id: 'new', title: 'New', artist: 'Artist', year: 2024, artwork: null, trackIds: ['new-2', 'new-1'] },
    { id: 'unknown', title: 'Unknown', artist: 'Artist', year: null, artwork: null, trackIds: ['unknown-1'] },
    { id: 'old', title: 'Old', artist: 'Artist', year: 2020, artwork: null, trackIds: ['old-2', 'old-1'] },
  ];
  const tracks = [
    makeTrack('new-2', 2), makeTrack('old-2', 2), makeTrack('unknown-1', 1),
    makeTrack('old-1', 1), makeTrack('new-1', 1), makeTrack('orphan', null),
  ];

  it('orders albums from oldest to newest and uses track numbers within each album', () => {
    expect(orderArtistTracks(artist, albums, tracks).map((track) => track.id)).toEqual([
      'old-1', 'old-2', 'new-1', 'new-2', 'unknown-1', 'orphan',
    ]);
  });
});

function makeTrack(id: string, trackNumber: number | null): Track {
  return {
    id, path: id, fileName: id, title: id, artist: 'Artist', albumArtist: 'Artist',
    album: null, genre: null, year: null, trackNumber, discNumber: 1, duration: 1,
    codec: null, bitrate: null, sampleRate: null, bitDepth: null, channels: null,
    artwork: null, fileSize: null, lastModified: null, isAvailable: true,
  };
}
