/** Body of POST /api/reservations: the customer comes from the access token, never from the body. */
export interface HoldSeatsRequest {
  screeningId: string;
  seatCount: number;
}

/** Same shape as ReservationDto of the API. */
export interface Reservation {
  reservationId: string;
  screeningId: string;
  /** The movie of the screening: the page of the hold goes back to it. */
  movieId: string;
  /** "PendingPayment" while the customer pays, "Expired" after 10 minutes, "Confirmed" once paid (US 3.1). */
  status: 'PendingPayment' | 'Expired' | 'Confirmed' | 'Cancelled';
  /** Seats given by the cinema: "A1", "A2". */
  seats: string[];
  totalAmount: number;
  /** Instant in UTC: "2026-10-30T17:07:59.961Z". */
  expiresAt: string | null;
}

/** The payment page of Stripe (US 3.1): the card is typed there, never on this site. */
export interface PaymentPage {
  checkoutUrl: string;
}

/** Same shape as TicketDto of the API (US 3.2): the ticket of a paid reservation. */
export interface Ticket {
  reservationId: string;
  /** 32 hexadecimal characters, drawn when the payment was confirmed: the content of the QR code. */
  ticketCode: string;
  movieTitle: string;
  /** Time of the cinema, without time zone: "2026-11-12T20:30:00". */
  startsAt: string;
  roomName: string;
  /** "A1", "A2": their number is the number of seats. */
  seats: string[];
  /** US 5.2: the screening was cancelled after the payment. */
  screeningCancelled: boolean;
}

/** Same shape as TicketSummaryDto of the API: a ticket in the list of my account. */
export interface TicketSummary {
  reservationId: string;
  movieTitle: string;
  startsAt: string;
  roomName: string;
  seatCount: number;
  screeningCancelled: boolean;
}
