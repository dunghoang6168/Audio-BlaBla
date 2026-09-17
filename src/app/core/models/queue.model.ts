import { Track } from './track.model';

export interface QueueEntry {
  id: string; // Unique entry ID so identical tracks can be in the queue independently
  track: Track;
  originalIndex: number;
}
