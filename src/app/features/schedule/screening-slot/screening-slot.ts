import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { Screening } from '../models/schedule';

/** One screening: time, room, and remaining seats or "Complet" (US 2.2). Used by the schedule and by the movie page. */
@Component({
  imports: [DatePipe],
  selector: 'app-screening-slot',
  templateUrl: './screening-slot.html',
})
export class ScreeningSlot {
  readonly screening = input.required<Screening>();
}
