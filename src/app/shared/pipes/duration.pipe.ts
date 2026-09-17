import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration',
  standalone: true,
})
export class DurationPipe implements PipeTransform {
  transform(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) {
      return '0:00';
    }

    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

    if (hours > 0) {
      const formattedMinutes = minutes.toString().padStart(2, '0');
      return `${hours}:${formattedMinutes}:${formattedSeconds}`;
    }

    return `${minutes}:${formattedSeconds}`;
  }
}
