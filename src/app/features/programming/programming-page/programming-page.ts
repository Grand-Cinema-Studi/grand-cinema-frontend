import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { problemMessage } from '../../../core/errors/problem-message';
import { ProgrammedScreening, Programming } from '../models/programming';
import { ProgrammingService } from '../programming.service';

/** A change waiting for the confirmation of the manager, because seats are held or sold (criterion 3). */
interface PendingChange {
  screening: ProgrammedScreening;
  /** Sends the same change again, confirmed. */
  confirm: () => void;
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
  protected readonly error = signal<string | null>(null);
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

  protected hasStarted(screening: ProgrammedScreening): boolean {
    return new Date(screening.startsAt).getTime() <= Date.now();
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

  /** On success the day is read again; on "screening-has-reservations" the manager is asked to confirm. */
  private send(change: Observable<unknown>, ifWarned?: PendingChange): void {
    this.error.set(null);
    this.pending.set(null);
    change.subscribe({
      next: () => {
        this.editedId.set(null);
        this.load(this.programming()?.date);
      },
      error: (error: unknown) => {
        if (ifWarned && isWarning(error)) {
          this.pending.set(ifWarned);
          return;
        }
        this.error.set(problemMessage(error));
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
