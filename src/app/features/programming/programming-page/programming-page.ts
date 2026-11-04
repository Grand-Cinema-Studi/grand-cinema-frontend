import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { problemMessage } from '../../../core/errors/problem-message';
import { ProgrammedScreening, Programming, ProgrammingMovie } from '../models/programming';
import { ProgrammingService } from '../programming.service';

/** A change waiting for the confirmation of the manager, because seats are held or sold (criterion 3). */
interface PendingChange {
  screening: ProgrammedScreening;
  /** Sends the same change again, confirmed. */
  confirm: () => void;
}

/** Where a screening stands: still to come, started (its movie is playing), or ended. */
type ScreeningState = 'upcoming' | 'started' | 'ended';

/** A refused change of a screening, shown under it. */
interface RowError {
  screeningId: string;
  message: string;
}

@Component({
  imports: [CurrencyPipe, DatePipe],
  selector: 'app-programming-page',
  templateUrl: './programming-page.html',
})
export class ProgrammingPage {
  private readonly programmingService = inject(ProgrammingService);

  protected readonly programming = signal<Programming | null>(null);
  protected readonly failed = signal(false);
  /** A refused new screening, shown under the form. */
  protected readonly addError = signal<string | null>(null);
  /** A refused change or cancellation, shown under its screening. */
  protected readonly rowError = signal<RowError | null>(null);
  protected readonly pending = signal<PendingChange | null>(null);

  // The form of a new screening, on the displayed day
  protected readonly movieId = signal('');
  protected readonly roomId = signal('');
  protected readonly time = signal('20:30');
  protected readonly price = signal(9.5);

  // The screening being moved, and its new day, time and price
  protected readonly editedId = signal<string | null>(null);
  protected readonly editedDay = signal('');
  protected readonly editedTime = signal('');
  protected readonly editedPrice = signal(0);

  constructor() {
    this.load();
  }

  /** Without a date, the API chooses today. */
  protected load(date?: string): void {
    this.programmingService.getProgramming(date).subscribe({
      next: (programming) => {
        this.programming.set(programming);
        this.failed.set(false);
      },
      error: () => this.failed.set(true),
    });
  }

  protected stateOf(screening: ProgrammedScreening, movies: ProgrammingMovie[]): ScreeningState {
    const startsAt = new Date(screening.startsAt).getTime();
    const now = Date.now();
    if (now < startsAt) {
      return 'upcoming';
    }
    // The length of its movie comes from the catalog sent with the day
    const minutes =
      movies.find((movie) => movie.movieId === screening.movieId)?.durationMinutes ?? 0;
    return now < startsAt + minutes * 60_000 ? 'started' : 'ended';
  }

  protected add(): void {
    const date = this.programming()?.date;
    if (!date) {
      return;
    }
    this.send(
      this.programmingService.createScreening({
        movieId: this.movieId(),
        roomId: this.roomId(),
        startsAt: `${date}T${this.time()}:00`,
        price: this.price(),
      }),
      {},
    );
  }

  protected edit(screening: ProgrammedScreening): void {
    this.editedId.set(screening.screeningId);
    this.editedDay.set(screening.startsAt.slice(0, 10));
    this.editedTime.set(screening.startsAt.slice(11, 16));
    this.editedPrice.set(screening.price);
  }

  protected move(screening: ProgrammedScreening, confirmed = false): void {
    const request = {
      startsAt: `${this.editedDay()}T${this.editedTime()}:00`,
      price: this.editedPrice(),
    };
    this.send(this.programmingService.updateScreening(screening.screeningId, request, confirmed), {
      screening,
      confirm: () => this.move(screening, true),
    });
  }

  protected cancel(screening: ProgrammedScreening, confirmed = false): void {
    this.send(this.programmingService.cancelScreening(screening.screeningId, confirmed), {
      screening,
      confirm: () => this.cancel(screening, true),
    });
  }

  protected confirmPending(): void {
    const change = this.pending();
    this.pending.set(null);
    change?.confirm();
  }

  /**
   * On success the day is read again. On "screening-has-reservations" the manager is asked to confirm, under the screening;
   * any other refusal is shown under the screening concerned, or under the form for a new screening.
   */
  private send(
    change: Observable<unknown>,
    about: { screening?: ProgrammedScreening; confirm?: () => void },
  ): void {
    this.addError.set(null);
    this.rowError.set(null);
    this.pending.set(null);
    change.subscribe({
      next: () => {
        this.editedId.set(null);
        this.load(this.programming()?.date);
      },
      error: (error: unknown) => {
        const { screening, confirm } = about;
        if (screening && confirm && isWarning(error)) {
          this.pending.set({ screening, confirm });
          return;
        }
        const message = problemMessage(error);
        if (screening) {
          this.rowError.set({ screeningId: screening.screeningId, message });
        } else {
          this.addError.set(message);
        }
      },
    });
  }
}

function isWarning(error: unknown): boolean {
  return (
    error instanceof HttpErrorResponse &&
    error.status === 409 &&
    (error.error as { type?: string } | null)?.type === '/errors/screening-has-reservations'
  );
}
