/** Same shape as ProgrammedScreeningDto of the API. */
export interface ProgrammedScreening {
  screeningId: string;
  movieId: string;
  movieTitle: string;
  roomId: string;
  roomName: string;
  /** Local time of the cinema, without time zone: "2026-07-18T20:30:00". */
  startsAt: string;
  price: number;
  /** Seats held (not expired) or sold: above zero, a change needs a confirmation. */
  takenSeats: number;
  capacity: number;
}

export interface ProgrammingMovie {
  movieId: string;
  title: string;
  durationMinutes: number;
}

export interface ProgrammingRoom {
  roomId: string;
  name: string;
  capacity: number;
}

/** Same shape as ProgrammingDto of the API: the screenings of a day, and what can be programmed. */
export interface Programming {
  date: string;
  screenings: ProgrammedScreening[];
  movies: ProgrammingMovie[];
  rooms: ProgrammingRoom[];
}

/** Body of POST /api/programming/screenings. */
export interface CreateScreeningRequest {
  movieId: string;
  roomId: string;
  startsAt: string;
  price: number;
}

/** Body of PUT /api/programming/screenings/{id}: the room and the movie do not change. */
export interface UpdateScreeningRequest {
  startsAt: string;
  price: number;
}
