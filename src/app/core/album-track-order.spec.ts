import { orderAlbumTracks, Track } from './models';

describe('orderAlbumTracks', () => {
  it('orders by disc and track number without mutating the source', () => {
    const source = [
      createTrack('disc-2-track-1', 2, 1),
      createTrack('disc-1-unknown', 1, null),
      createTrack('disc-1-track-2', 1, 2),
      createTrack('disc-1-track-1', 1, 1),
    ];

    const ordered = orderAlbumTracks(source);

    expect(ordered.map((track) => track.id)).toEqual([
      'disc-1-track-1',
      'disc-1-track-2',
      'disc-1-unknown',
      'disc-2-track-1',
    ]);
    expect(source[0].id).toBe('disc-2-track-1');
  });

  it('uses title and path as stable tie breakers', () => {
    const ordered = orderAlbumTracks([
      createTrack('beta', 1, 1, 'Beta', 'C:\\Music\\02.flac'),
      createTrack('alpha-b', 1, 1, 'Alpha', 'C:\\Music\\01-b.flac'),
      createTrack('alpha-a', null, 1, 'Alpha', 'C:\\Music\\01-a.flac'),
    ]);

    expect(ordered.map((track) => track.id)).toEqual(['alpha-a', 'alpha-b', 'beta']);
  });
});

function createTrack(
  id: string,
  discNumber: number | null,
  trackNumber: number | null,
  title = id,
  path = `C:\\Music\\${id}.flac`,
): Track {
  return {
    id,
    path,
    fileName: `${id}.flac`,
    title,
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
