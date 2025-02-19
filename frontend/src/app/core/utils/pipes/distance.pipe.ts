import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'readableDistance',
  pure: true,
  standalone: true,
})
export class ReadableDistancePipe implements PipeTransform {
  transform(distanceInFeet: number | null | undefined): string {
    if (distanceInFeet === null || distanceInFeet === undefined) {
      return 'Unknown distance';
    }

    if (distanceInFeet <= 200) {
      const roundedDistance = Math.round(distanceInFeet / 50) * 50;
      return `${roundedDistance} ft`;
    } else {
      const miles = distanceInFeet / 5280;
      if (miles < 0.1) {
        return `${Math.round(distanceInFeet)} ft`;
      }

      return `${miles.toFixed(1)} miles`;
    }
  }
}
