import { Pipe, PipeTransform } from '@angular/core';
import { differenceInMinutes } from 'date-fns';

@Pipe({
  name: 'diffMinutes',
  pure: true,
  standalone: true,
})
export class DiffMinutesPipe implements PipeTransform {
  transform(date: Date): number {
    return differenceInMinutes(date, new Date());
  }
}
