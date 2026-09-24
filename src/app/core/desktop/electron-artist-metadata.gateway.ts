import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ArtistMetadataGateway } from '../contracts';
import { ArtistMatchCandidate, ArtistMetadataUpdate, ArtistOnlineMetadata } from '../models';
import { getDesktopApi } from './desktop-api';

@Injectable()
export class ElectronArtistMetadataGateway implements ArtistMetadataGateway {
  private readonly api = getDesktopApi();
  private readonly updates = new Subject<ArtistMetadataUpdate>();
  readonly updates$: Observable<ArtistMetadataUpdate> = this.updates.asObservable();

  constructor() { this.requireApi().artistMetadata.onUpdated((value) => this.updates.next(value)); }
  refreshMissing(force = false): Promise<void> { return this.requireApi().artistMetadata.refreshMissing(force); }
  ensureArtist(artistId: string): Promise<void> { return this.requireApi().artistMetadata.ensureArtist(artistId); }
  refreshArtist(artistId: string): Promise<ArtistOnlineMetadata | null> { return this.requireApi().artistMetadata.refreshArtist(artistId); }
  searchCandidates(artistName: string): Promise<ArtistMatchCandidate[]> { return this.requireApi().artistMetadata.searchCandidates(artistName); }
  setArtistMatch(artistId: string, musicBrainzId: string): Promise<ArtistOnlineMetadata | null> { return this.requireApi().artistMetadata.setArtistMatch(artistId, musicBrainzId); }
  setWikipediaOverride(artistId: string, url: string | null): Promise<ArtistOnlineMetadata | null> { return this.requireApi().artistMetadata.setWikipediaOverride(artistId, url); }
  selectCustomAvatar(artistId: string): Promise<string | null> { return this.requireApi().artistMetadata.selectCustomAvatar(artistId); }
  clearCustomAvatar(artistId: string): Promise<void> { return this.requireApi().artistMetadata.clearCustomAvatar(artistId); }
  openSource(url: string): Promise<void> { return this.requireApi().artistMetadata.openSource(url); }

  private requireApi() {
    if (!this.api) throw new Error('Electron desktop API is unavailable');
    return this.api;
  }
}
