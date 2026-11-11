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
  /** US 5.6: the whole card, for the form that edits it. */
  synopsis: string;
  genre: string;
  /** "1988-09-30". */
  releaseDate: string;
  posterUrl: string;
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
  /** US 5.6: the genres a movie may have, chosen by the manager in the form of a new movie. */
  genres: string[];
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

/** US 5.6: the form of a new movie, sent as multipart/form-data. */
export interface CreateMovieRequest {
  title: string;
  synopsis: string;
  durationMinutes: number;
  genre: string;
  /** "1986-10-03". */
  releaseDate: string;
  /** JPEG, PNG or WebP, 2 MB at most: the API reads its first bytes. */
  poster: File;
}

/** US 5.6: the fields of CreateMovieRequest; without a new poster (null), the poster does not change. */
export interface UpdateMovieRequest extends Omit<CreateMovieRequest, 'poster'> {
  poster: File | null;
}
