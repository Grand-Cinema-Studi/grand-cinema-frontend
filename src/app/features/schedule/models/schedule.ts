export interface Screening {
  screeningId: string;
  roomName: string;
  /** Local time of the cinema (Europe/Paris), without time zone: "2026-07-18T20:30:00". */
  startsAt: string;
  price: number;
  /** Seats still on sale (US 2.2): the API has already subtracted the seats sold or held by a payment in progress. */
  remainingSeats: number;
}

export interface MovieSchedule {
  movieId: string;
  title: string;
  synopsis: string;
  durationMinutes: number;
  genre: string;
  releaseDate: string;
  posterUrl: string;
  screenings: Screening[];
}

export interface Schedule {
  /** Day of the schedule: "2026-07-18". */
  date: string;
  movies: MovieSchedule[];
}
