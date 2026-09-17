import { Pipe, PipeTransform } from '@angular/core';
import { Track } from '../../core/models';

@Pipe({
  name: 'qualityLabel',
  standalone: true,
})
export class QualityLabelPipe implements PipeTransform {
  transform(track: Track | null | undefined): string {
    if (!track) {
      return '';
    }

    const parts: string[] = [];

    // 1. Codec
    if (track.codec) {
      parts.push(track.codec.toUpperCase());
    }

    // 2. Bit Depth (omit if null, e.g. lossy formats)
    if (track.bitDepth && track.bitDepth > 0) {
      parts.push(`${track.bitDepth}-bit`);
    }

    // 3. Sample Rate (e.g. 96000 -> 96 kHz, 44100 -> 44.1 kHz)
    if (track.sampleRate && track.sampleRate > 0) {
      const khz = track.sampleRate / 1000;
      const formattedKhz = Number.isInteger(khz) ? khz.toString() : khz.toFixed(1);
      parts.push(`${formattedKhz} kHz`);
    }

    // 4. Bitrate (e.g. 2840000 -> 2840 kbps, 320000 -> 320 kbps)
    if (track.bitrate && track.bitrate > 0) {
      const kbps = Math.round(track.bitrate / 1000);
      parts.push(`${kbps} kbps`);
    }

    return parts.join(' • ');
  }
}
