import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ReservationTracking, ScreeningTracking } from '../models/reservation-tracking';
import { TrackingService } from '../tracking.service';

/** Seats sold, online and at the counter; the held seats are not sold yet. */
function sold(screening: ScreeningTracking): number {
  return screening.soldOnline + screening.soldAtCounter;
}

/** Share of the capacity sold, rounded to the unit. */
function fillRate(soldSeats: number, capacity: number): number {
  return capacity === 0 ? 0 : Math.round((soldSeats / capacity) * 100);
}

@Component({
  imports: [DatePipe],
  selector: 'app-tracking-page',
  templateUrl: './tracking-page.html',
})
export class TrackingPage {
  private readonly trackingService = inject(TrackingService);

  protected readonly tracking = signal<ReservationTracking | null>(null);
  protected readonly failed = signal(false);

  protected readonly sold = sold;
  protected readonly fillRate = fillRate;

  /** The whole day: seats sold of the seats of all its screenings. */
  protected readonly total = computed(() => {
    const screenings = this.tracking()?.screenings ?? [];
    const soldSeats = screenings.reduce((sum, screening) => sum + sold(screening), 0);
    const capacity = screenings.reduce((sum, screening) => sum + screening.capacity, 0);
    return { soldSeats, capacity, rate: fillRate(soldSeats, capacity) };
  });

  constructor() {
    this.load();
  }

  /** Without a date, the API chooses today. */
  protected load(date?: string): void {
    this.trackingService.getTracking(date).subscribe({
      next: (tracking) => {
        this.tracking.set(tracking);
        this.failed.set(false);
      },
      error: () => this.failed.set(true),
    });
  }
}
