import { QualityLabelPipe } from './quality-label.pipe';
import { Track } from '../../core/models';

describe('QualityLabelPipe', () => {
  let pipe: QualityLabelPipe;

  beforeEach(() => {
    pipe = new QualityLabelPipe();
  });

  it('should return empty string when track is null or undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should format Hi-Res FLAC with 24-bit and 96 kHz', () => {
    const track: Partial<Track> = {
      codec: 'FLAC',
      bitDepth: 24,
      sampleRate: 96000,
      bitrate: 2840000,
    };
    expect(pipe.transform(track as Track)).toBe('FLAC • 24-bit • 96 kHz • 2840 kbps');
  });

  it('should format standard MP3 and omit bitDepth', () => {
    const track: Partial<Track> = {
      codec: 'MP3',
      bitDepth: null,
      sampleRate: 44100,
      bitrate: 320000,
    };
    expect(pipe.transform(track as Track)).toBe('MP3 • 44.1 kHz • 320 kbps');
  });

  it('should format WAV 192 kHz', () => {
    const track: Partial<Track> = {
      codec: 'WAV',
      bitDepth: 24,
      sampleRate: 192000,
      bitrate: 9216000,
    };
    expect(pipe.transform(track as Track)).toBe('WAV • 24-bit • 192 kHz • 9216 kbps');
  });
});
