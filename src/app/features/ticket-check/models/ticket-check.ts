/** Same shape as TicketCheckScreeningDto of the API (US 4.1): a screening the inspector can control. */
export interface TicketCheckScreening {
  screeningId: string;
  /** Time of the cinema, without time zone. */
  startsAt: string;
  movieTitle: string;
  roomName: string;
}

/** Same shape as TicketCheckDto of the API: what the inspector sees when a ticket lets its holders in. */
export interface TicketCheck {
  movieTitle: string;
  startsAt: string;
  roomName: string;
  seats: string[];
}
