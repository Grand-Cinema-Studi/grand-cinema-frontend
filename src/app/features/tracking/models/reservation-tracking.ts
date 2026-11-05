/** Same shape as ScreeningTrackingDto of the API. */
export interface ScreeningTracking {
  screeningId: string;
  /** Local time of the cinema, without time zone: "2026-07-18T20:30:00". */
  startsAt: string;
  movieTitle: string;
  roomName: string;
  capacity: number;
  /** Paid on Stripe. */
  soldOnline: number;
  /** Paid at the counter. */
  soldAtCounter: number;
  /** Held by a payment in progress (10 minutes). */
  heldSeats: number;
  remainingSeats: number;
}

/** Same shape as ReservationTrackingDto of the API. */
export interface ReservationTracking {
  date: string;
  screenings: ScreeningTracking[];
}
