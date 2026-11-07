import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TicketCheck, TicketCheckScreening } from './models/ticket-check';

/** US 4.1: the API answers 403 to every role but the inspector. */
@Injectable({ providedIn: 'root' })
export class TicketCheckService {
  private readonly http = inject(HttpClient);

  /** The screenings of today, started ones included. */
  getScreenings(): Observable<TicketCheckScreening[]> {
    throw new Error('Step 22b');
  }

  /** 200: let in, the ticket is now used; 409 ticket-already-used, 409 ticket-for-another-screening, 404 ticket-not-found. */
  checkTicket(screeningId: string, ticketCode: string): Observable<TicketCheck> {
    throw new Error(`Step 22b: ${screeningId} ${ticketCode}`);
  }
}
