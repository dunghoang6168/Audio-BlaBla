import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { ArtistMatchCandidate, ArtistMetadataUpdate, ArtistOnlineMetadata } from '../models';

export interface ArtistMetadataGateway {
  readonly updates$: Observable<ArtistMetadataUpdate>;
  refreshMissing(force?: boolean): Promise<void>;
  ensureArtist(artistId: string): Promise<void>;
  refreshArtist(artistId: string): Promise<ArtistOnlineMetadata | null>;
  searchCandidates(artistName: string): Promise<ArtistMatchCandidate[]>;
  setArtistMatch(artistId: string, musicBrainzId: string): Promise<ArtistOnlineMetadata | null>;
  setWikipediaOverride(artistId: string, url: string | null): Promise<ArtistOnlineMetadata | null>;
  selectCustomAvatar(artistId: string): Promise<string | null>;
  clearCustomAvatar(artistId: string): Promise<void>;
  openSource(url: string): Promise<void>;
}

export const ARTIST_METADATA_GATEWAY = new InjectionToken<ArtistMetadataGateway>('ARTIST_METADATA_GATEWAY');
