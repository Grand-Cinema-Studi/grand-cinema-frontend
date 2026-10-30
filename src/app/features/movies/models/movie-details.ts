import { Screening } from '../../schedule/models/schedule';
import { Movie } from './movie';

/** One day of screenings of a movie: "2026-10-31", with its screenings sorted by time. */
export interface ScreeningDay {
  date: string;
  screenings: Screening[];
}

/** Response of GET /api/movies/{id}: the movie and all its upcoming screenings, one entry per day in date order. */
export interface MovieDetails extends Movie {
  days: ScreeningDay[];
}
