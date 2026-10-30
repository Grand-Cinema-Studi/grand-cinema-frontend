/** Body of POST /api/reservations: the customer comes from the access token, never from the body. */
export interface HoldSeatsRequest {
  screeningId: string;
  seatCount: number;
}

/** Same shape as ReservationDto of the API. */
export interface Reservation {
  reservationId: string;
  screeningId: string;
  /** "PendingPayment" while the customer pays, "Expired" after 10 minutes, "Confirmed" once paid (US 3.1). */
  status: 'PendingPayment' | 'Expired' | 'Confirmed' | 'Cancelled';
  /** Seats given by the cinema: "A1", "A2". */
  seats: string[];
  totalAmount: number;
  /** Instant in UTC: "2026-10-30T17:07:59.961Z". */
  expiresAt: string | null;
}
