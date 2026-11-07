import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { TicketCheck, TicketCheckScreening } from '../models/ticket-check';
import { TicketCheckService } from '../ticket-check.service';
import { TicketScanner } from '../ticket-scanner/ticket-scanner';

/** The verdict shown at once after a scan (US 4.1, criterion 4). */
type Verdict = { granted: true; ticket: TicketCheck } | { granted: false; reason: string };

/** An explicit message per refusal (US 4.1, criteria 2 and 3). */
const REFUSALS: Record<string, string> = {
  '/errors/ticket-already-used': 'Billet déjà utilisé.',
  '/errors/ticket-for-another-screening': 'Ce billet est pour une autre séance.',
  '/errors/ticket-not-found': 'QR code inconnu ou illisible.',
};

/** US 4.1: the inspector chooses his screening, then scans or types each ticket code. */
@Component({
  imports: [DatePipe, ReactiveFormsModule, TicketScanner],
  selector: 'app-ticket-check-page',
  templateUrl: './ticket-check-page.html',
})
export class TicketCheckPage {
  private readonly service = inject(TicketCheckService);

  /** Today's screenings; null if they cannot be read. */
  protected readonly screenings = toSignal(
    this.service.getScreenings().pipe(catchError(() => of(null))),
    { initialValue: undefined },
  );
  /** The screening controlled: the first of the day until the inspector chooses. */
  protected readonly screeningId = linkedSignal(() => this.screenings()?.[0]?.screeningId ?? '');
  protected readonly verdict = signal<Verdict | null>(null);
  protected readonly code = new FormControl('', { nonNullable: true });

  /** From the camera or from the form. */
  protected check(text: string): void {
    const ticketCode = text.trim();
    if (!ticketCode || !this.screeningId()) {
      return;
    }
    this.service.checkTicket(this.screeningId(), ticketCode).subscribe({
      next: (ticket) => this.verdict.set({ granted: true, ticket }),
      error: (error: HttpErrorResponse) =>
        this.verdict.set({
          granted: false,
          reason:
            REFUSALS[error.error?.type as string] ??
            'Vérification impossible. Réessayez, ou saisissez le code.',
        }),
    });
  }

  protected submit(): void {
    this.check(this.code.value);
    this.code.reset();
  }

  protected label(screening: TicketCheckScreening): string {
    return `${screening.startsAt.slice(11, 16)} · ${screening.movieTitle} · ${screening.roomName}`;
  }
}
