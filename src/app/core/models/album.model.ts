export interface Album {
  id: string;
  title: string;
  artist: string | null;
  year: number | null;
  artwork: string | null;
  trackIds: string[];
}
