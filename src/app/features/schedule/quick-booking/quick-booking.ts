import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, input, linkedSignal, output } from '@angular/core';
import { MovieSchedule } from '../models/schedule';

@Component({
  imports: [DatePipe, TitleCasePipe],
  selector: 'app-quick-booking',
  templateUrl: './quick-booking.html',
})
export class QuickBooking {
  readonly days = input.required<string[]>();
  readonly selectedDay = input.required<string | null>();
  readonly movies = input.required<MovieSchedule[]>();
  readonly dayChange = output<string>();
  /** The chosen movie, or null to look at the whole day. */
  readonly find = output<string | null>();

  /** No film chosen again whenever the films of the day change. */
  protected readonly movieId = linkedSignal({ source: this.movies, computation: () => '' });

  protected findScreening(): void {
    this.find.emit(this.movieId() || null);
  }
}
