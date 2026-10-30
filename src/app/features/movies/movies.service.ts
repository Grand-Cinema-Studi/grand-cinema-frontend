import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Movie } from './models/movie';
import { MovieDetails } from './models/movie-details';

@Injectable({ providedIn: 'root' })
export class MoviesService {
  private readonly http = inject(HttpClient);

  getMoviesShowing(): Observable<Movie[]> {
    return this.http.get<Movie[]>('/api/movies');
  }

  /** A movie and all its upcoming screenings, grouped by day; 404 "movie-not-found" for an unknown movie. */
  getMovieDetails(movieId: string): Observable<MovieDetails> {
    return this.http.get<MovieDetails>(`/api/movies/${movieId}`);
  }
}
