import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Screening } from '../models/schedule';

/** One screening: time, room, and remaining seats or "Complet" (US 2.2). Used by the schedule and by the movie page. */
@Component({
  imports: [DatePipe, NgTemplateOutlet, RouterLink],
  selector: 'app-screening-slot',
  templateUrl: './screening-slot.html',
})
export class ScreeningSlot {
  readonly screening = input.required<Screening>();
  /** The movie of the screening: a screening with seats left opens its page, with the booking form (US 2.3). */
  readonly movieId = input.required<string>();
}
