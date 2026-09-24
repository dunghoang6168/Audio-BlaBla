export interface TrackDetails {
  trackId: string;
  metadata: {
    title: string | null;
    artists: string[];
    album: string | null;
    albumArtists: string[];
    date: string | null;
    year: number | null;
    composers: string[];
    genres: string[];
    trackNumber: number | null;
    totalTracks: number | null;
    discNumber: number | null;
    totalDiscs: number | null;
  };
  audio: {
    duration: number | null;
    numberOfSamples: number | null;
    sampleRate: number | null;
    channels: number | null;
    bitsPerSample: number | null;
    bitrate: number | null;
    codec: string | null;
    codecProfile: string | null;
    container: string | null;
    lossless: boolean | null;
    encoderTool: string | null;
    tagTypes: string[];
    audioMd5: string | null;
  };
  file: {
    fileName: string;
    path: string;
    fileSize: number | null;
    lastModified: number | null;
  };
}
