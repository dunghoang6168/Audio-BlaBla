import { Album, Artist, orderAlbumTracks, Track } from '../../core/models';

/** Albums by release year, then tracks by disc and track number. */
export function orderArtistTracks(artist: Artist, albums: readonly Album[], tracks: readonly Track[]): Track[] {
  const artistTrackIds = new Set(artist.trackIds);
  const tracksById = new Map(tracks.map((track) => [track.id, track]));
  const usedIds = new Set<string>();
  const ordered: Track[] = [];

  const artistAlbums = albums
    .filter((album) => artist.albumIds.includes(album.id))
    .sort((a, b) => {
      const yearDifference = (a.year ?? Number.POSITIVE_INFINITY) - (b.year ?? Number.POSITIVE_INFINITY);
      return yearDifference || a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true }) || a.id.localeCompare(b.id);
    });

  for (const album of artistAlbums) {
    const albumTracks = album.trackIds.flatMap((id) => {
      const track = tracksById.get(id);
      return track && artistTrackIds.has(id) && !usedIds.has(id) ? [track] : [];
    });
    for (const track of orderAlbumTracks(albumTracks)) {
      ordered.push(track);
      usedIds.add(track.id);
    }
  }

  // Keep artist tracks whose album metadata is missing in the queue.
  for (const id of artist.trackIds) {
    const track = tracksById.get(id);
    if (track && !usedIds.has(id)) {
      ordered.push(track);
      usedIds.add(id);
    }
  }

  return ordered;
}
