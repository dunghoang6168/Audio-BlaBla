export interface Artist {
  id: string;
  name: string;
  albumIds: string[];
  trackIds: string[];
  onlineMetadata: ArtistOnlineMetadata | null;
  customAvatar: string | null;
}

export type ArtistMetadataSource = 'musicbrainz' | 'wikipedia' | 'wikidata' | 'theaudiodb';

export interface ArtistOnlineMetadata {
  musicBrainzId: string;
  matchMode: 'automatic' | 'manual';
  biography: string | null;
  biographySourceUrl: string | null;
  avatar: string | null;
  avatarSourceUrl: string | null;
  aboutImage: string | null;
  aboutImageSourceUrl: string | null;
  sources: ArtistMetadataSource[];
  fetchedAt: number;
}

export interface ArtistMatchCandidate {
  musicBrainzId: string;
  name: string;
  aliases: string[];
  type: string | null;
  country: string | null;
  disambiguation: string | null;
  score: number;
}

export interface ArtistMetadataUpdate {
  artistId: string;
  metadata: ArtistOnlineMetadata | null;
  customAvatar?: string | null;
  status: 'available' | 'not-found' | 'ambiguous' | 'matched-empty' | 'error';
  error?: string;
}
