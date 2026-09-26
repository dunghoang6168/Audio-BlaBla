import { InjectionToken } from '@angular/core';

export interface LyricsGateway {
  getLyrics(trackId: string): Promise<string | null>;
}

export const LYRICS_GATEWAY = new InjectionToken<LyricsGateway>('LYRICS_GATEWAY');
