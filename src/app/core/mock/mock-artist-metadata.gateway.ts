import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ArtistMetadataGateway } from '../contracts';
import { ArtistMatchCandidate, ArtistMetadataUpdate, ArtistOnlineMetadata } from '../models';
import { MOCK_ARTISTS } from './fixtures/mock-data';

@Injectable({ providedIn: 'root' })
export class MockArtistMetadataGateway implements ArtistMetadataGateway {
  private readonly updates = new Subject<ArtistMetadataUpdate>();
  readonly updates$: Observable<ArtistMetadataUpdate> = this.updates.asObservable();
  async refreshMissing(_force = false): Promise<void> {
    for (const artist of MOCK_ARTISTS) if (artist.onlineMetadata) this.updates.next({ artistId: artist.id, metadata: artist.onlineMetadata, status: 'available' });
  }
  async ensureArtist(artistId: string): Promise<void> {
    const metadata = MOCK_ARTISTS.find((artist) => artist.id === artistId)?.onlineMetadata ?? null;
    this.updates.next({ artistId, metadata, status: metadata ? 'available' : 'not-found' });
  }
  async refreshArtist(artistId: string): Promise<ArtistOnlineMetadata | null> {
    const metadata = MOCK_ARTISTS.find((artist) => artist.id === artistId)?.onlineMetadata ?? null;
    this.updates.next({ artistId, metadata, status: metadata ? 'available' : 'not-found' });
    return metadata;
  }
  async searchCandidates(artistName: string): Promise<ArtistMatchCandidate[]> {
    return [{ musicBrainzId: '11111111-1111-4111-8111-111111111111', name: artistName, aliases: [], type: 'Person', country: 'JP', disambiguation: 'Mock artist profile', score: 100 }];
  }
  async setArtistMatch(artistId: string, _musicBrainzId: string): Promise<ArtistOnlineMetadata | null> { return this.refreshArtist(artistId); }
  async setWikipediaOverride(artistId: string, _url: string | null): Promise<ArtistOnlineMetadata | null> { return this.refreshArtist(artistId); }
  async selectCustomAvatar(_artistId: string): Promise<string | null> { return null; }
  async clearCustomAvatar(_artistId: string): Promise<void> { return; }
  async openSource(_url: string): Promise<void> { return; }
}
