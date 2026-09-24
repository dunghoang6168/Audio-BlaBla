import { Album, Artist } from '../../core/models';
import { artistAvatarCandidates } from './artist-avatar';

describe('artist avatar precedence', () => {
  const albums: Album[] = [
    { id: 'old', title: 'Old', artist: 'Test', year: 2020, artwork: 'music://artwork/old', trackIds: [] },
    { id: 'new', title: 'New', artist: 'Test', year: 2024, artwork: 'music://artwork/new', trackIds: [] },
  ];
  const artist: Artist = {
    id: 'artist-1', name: 'Test', albumIds: ['old', 'new'], trackIds: [], customAvatar: 'music://artwork/custom',
    onlineMetadata: {
      musicBrainzId: '11111111-1111-4111-8111-111111111111', matchMode: 'automatic',
      biography: null, biographySourceUrl: null, avatar: 'music://artwork/online', avatarSourceUrl: null,
      aboutImage: null, aboutImageSourceUrl: null, sources: ['musicbrainz'], fetchedAt: 1,
    },
  };

  it('tries custom, online, then newest album artwork', () => {
    expect(artistAvatarCandidates(artist, albums)).toEqual(['music://artwork/custom', 'music://artwork/online', 'music://artwork/new']);
  });

  it('falls back to the initial when no image exists', () => {
    expect(artistAvatarCandidates({ ...artist, customAvatar: null, onlineMetadata: null, albumIds: [] }, albums)).toEqual([]);
  });

  it('uses artist album order when years are equal or absent', () => {
    expect(artistAvatarCandidates({ ...artist, customAvatar: null, onlineMetadata: null }, albums.map((album) => ({ ...album, year: null })))).toEqual(['music://artwork/old']);
  });
});
