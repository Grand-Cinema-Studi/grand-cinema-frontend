import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { RuntimePipe } from '../../../shared/runtime.pipe';
import { ScreeningSlot } from '../../schedule/screening-slot/screening-slot';
import { MovieDetails } from '../models/movie-details';
import { MoviesService } from '../movies.service';

type MovieState =
  | { status: 'loading' }
  | { status: 'loaded'; movie: MovieDetails }
  | { status: 'not-found' }
  | { status: 'failed' };

/** Days of screenings shown at first, then added by each "Voir les dates suivantes". */
const DAYS_PER_STEP = 7;

/** Format of the identifiers of the API (GUID): any other address cannot be a movie. */
const MOVIE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isMovieNotFound(error: unknown): boolean {
  return (
    error instanceof HttpErrorResponse &&
    (error.error as { type?: string } | null)?.type === '/errors/movie-not-found'
  );
}

@Component({
  imports: [DatePipe, RouterLink, RuntimePipe, ScreeningSlot],
  selector: 'app-movie-page',
  templateUrl: './movie-page.html',
})
export class MoviePage {
  private readonly moviesService = inject(MoviesService);

  /** Identifier of the movie, read from the address /movies/:movieId (withComponentInputBinding). */
  readonly movieId = input.required<string>();
  /** The screening chosen on a slot (?screening=…), whose booking form is shown (US 2.3). */
  readonly screening = input<string>();

  protected readonly state = toSignal(
    toObservable(this.movieId).pipe(
      switchMap((movieId) => {
        // An unknown route of the API answers 401 to a visitor: checked here, the address gives "Film introuvable"
        if (!MOVIE_ID.test(movieId)) {
          return of<MovieState>({ status: 'not-found' });
        }
        return this.moviesService.getMovieDetails(movieId).pipe(
          map((movie): MovieState => ({ status: 'loaded', movie })),
          catchError((error: unknown) =>
            of<MovieState>(isMovieNotFound(error) ? { status: 'not-found' } : { status: 'failed' }),
          ),
          startWith<MovieState>({ status: 'loading' }),
        );
      }),
    ),
    { initialValue: { status: 'loading' } as MovieState },
  );

  protected readonly movie = computed(() => {
    const state = this.state();
    return state.status === 'loaded' ? state.movie : null;
  });

  /** Number of days shown; back to the first seven whenever another movie is opened. */
  protected readonly shownDays = linkedSignal({
    source: this.movieId,
    computation: () => DAYS_PER_STEP,
  });

  protected readonly days = computed(() => this.movie()?.days.slice(0, this.shownDays()) ?? []);

  protected readonly hasMoreDays = computed(
    () => (this.movie()?.days.length ?? 0) > this.shownDays(),
  );

  protected showMoreDays(): void {
    this.shownDays.update((count) => count + DAYS_PER_STEP);
  }
}
