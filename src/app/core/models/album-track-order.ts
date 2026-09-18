import type { Track } from './track.model';

/** Canonical playback order for tracks that belong to the same album. */
export function compareAlbumTracks(a: Track, b: Track): number {
  const discDifference = (a.discNumber ?? 1) - (b.discNumber ?? 1);
  if (discDifference !== 0) return discDifference;

  if (a.trackNumber != null && b.trackNumber == null) return -1;
  if (a.trackNumber == null && b.trackNumber != null) return 1;
  if (a.trackNumber != null && b.trackNumber != null) {
    const trackDifference = a.trackNumber - b.trackNumber;
    if (trackDifference !== 0) return trackDifference;
  }

  const titleDifference = a.title.localeCompare(b.title, undefined, {
    sensitivity: 'base',
    numeric: true,
  });
  if (titleDifference !== 0) return titleDifference;

  const pathDifference = a.path.localeCompare(b.path, undefined, {
    sensitivity: 'base',
    numeric: true,
  });
  return pathDifference !== 0 ? pathDifference : a.id.localeCompare(b.id);
}

export function orderAlbumTracks(tracks: readonly Track[]): Track[] {
  return [...tracks].sort(compareAlbumTracks);
}
