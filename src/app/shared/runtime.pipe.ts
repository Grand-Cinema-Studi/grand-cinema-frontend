import { Pipe, PipeTransform } from '@angular/core';

/** Formats a running time in minutes as shown on the mockups: "2h 06m", or "45m" under an hour. */
@Pipe({ name: 'runtime' })
export class RuntimePipe implements PipeTransform {
  transform(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = String(minutes % 60).padStart(2, '0');
    return hours > 0 ? `${hours}h ${rest}m` : `${minutes}m`;
  }
}
