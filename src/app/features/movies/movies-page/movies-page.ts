import { ViewportScroller } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith } from 'rxjs';
import { MovieCard } from '../../../shared/movie-card/movie-card';
import { Paginator } from '../../../shared/paginator/paginator';
import { MOVIES_PER_PAGE, pageCount, pageItems } from '../../../shared/paginator/pages';
import { Movie } from '../models/movie';
import { MoviesService } from '../movies.service';

type MoviesState =
  { status: 'loading' } | { status: 'loaded'; movies: Movie[] } | { status: 'failed' };

@Component({
  imports: [MovieCard, Paginator],
  selector: 'app-movies-page',
  templateUrl: './movies-page.html',
})
export class MoviesPage {
  private readonly scroller = inject(ViewportScroller);

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

  protected readonly page = signal(1);
  protected readonly pageCount = computed(() => pageCount(this.movies().length, MOVIES_PER_PAGE));
  protected readonly pageMovies = computed(() =>
    pageItems(this.movies(), this.page(), MOVIES_PER_PAGE),
  );

  protected choosePage(page: number): void {
    this.page.set(page);
    // The top of the list is already displayed: no need to wait for the next render
    this.scroller.scrollToAnchor('movies');
  }
}
