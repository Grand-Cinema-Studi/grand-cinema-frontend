import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith } from 'rxjs';
import { MovieCard } from '../../../shared/movie-card/movie-card';
import { Movie } from '../models/movie';
import { MoviesService } from '../movies.service';

type MoviesState =
  { status: 'loading' } | { status: 'loaded'; movies: Movie[] } | { status: 'failed' };

@Component({
  imports: [MovieCard],
  selector: 'app-movies-page',
  templateUrl: './movies-page.html',
})
export class MoviesPage {
  protected readonly state = toSignal(
    inject(MoviesService)
      .getMoviesShowing()
      .pipe(
        map((movies): MoviesState => ({ status: 'loaded', movies })),
        catchError(() => of<MoviesState>({ status: 'failed' })),
        startWith<MoviesState>({ status: 'loading' }),
      ),
    { initialValue: { status: 'loading' } as MoviesState },
  );

  protected readonly movies = computed(() => {
    const state = this.state();
    return state.status === 'loaded' ? state.movies : [];
  });
}
