import { ViewportScroller, formatDate } from '@angular/common';
import { Component, LOCALE_ID, afterRenderEffect, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap, tap } from 'rxjs';
import { MovieCard } from '../../../shared/movie-card/movie-card';
import { Paginator } from '../../../shared/paginator/paginator';
import {
  MOVIES_PER_PAGE,
  pageCount,
  pageItems,
  pageOfIndex,
} from '../../../shared/paginator/pages';
import { CinemaExperience } from '../../cinema/cinema-experience/cinema-experience';
import { Movie } from '../../movies/models/movie';
import { MoviesService } from '../../movies/movies.service';
import { FeaturedMovies } from '../featured-movies/featured-movies';
import { Schedule } from '../models/schedule';
import { QuickBooking } from '../quick-booking/quick-booking';
import { ScheduleService } from '../schedule.service';
import { ScreeningSlot } from '../screening-slot/screening-slot';

type ScheduleState =
  { status: 'loading' } | { status: 'loaded'; schedule: Schedule } | { status: 'failed' };

const DAYS_OFFERED = 7;

/** Adds days to a "yyyy-MM-dd" day, without time zone: the result is the calendar day that follows. */
function addDays(day: string, count: number): string {
  const [year, month, date] = day.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, date + count));
  return next.toISOString().slice(0, 10);
}

/** The same calendar day a year later: "2026-07-18" gives "2027-07-18" (decision of 29/10/2026: booking up to a year ahead). */
function addOneYear(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year + 1, month - 1, date)).toISOString().slice(0, 10);
}

@Component({
  imports: [
    CinemaExperience,
    FeaturedMovies,
    MovieCard,
    Paginator,
    QuickBooking,
    RouterLink,
    ScreeningSlot,
  ],
  selector: 'app-schedule-page',
  templateUrl: './schedule-page.html',
})
export class SchedulePage {
  private readonly scheduleService = inject(ScheduleService);
  private readonly moviesService = inject(MoviesService);
  private readonly scroller = inject(ViewportScroller);
  private readonly locale = inject(LOCALE_ID);

  /** Day chosen by the visitor; undefined until a day is chosen, so that the API decides what "today" is. */
  private readonly chosenDay = signal<string | undefined>(undefined);
  /** Today in the time zone of the cinema, as returned by the API on the first load. */
  protected readonly today = signal<string | null>(null);
  /** The featured movies of the API, read once: they do not depend on the day displayed nor on the time of day. */
  protected readonly featured = toSignal(
    this.moviesService.getFeaturedMovies().pipe(catchError(() => of<Movie[]>([]))),
    { initialValue: [] as Movie[] },
  );
  protected readonly genre = signal('');
  /** Page of the list of movies, numbered from 1; back to 1 whenever the day or the genre changes. */
  protected readonly page = signal(1);
  /** Element to scroll to once the schedule it belongs to is displayed. */
  private readonly pendingAnchor = signal<string | null>(null);

  protected readonly state = toSignal(
    toObservable(this.chosenDay).pipe(
      switchMap((day) =>
        this.scheduleService.getSchedule(day).pipe(
          tap((schedule) => {
            if (day === undefined) {
              this.today.set(schedule.date);
            }
          }),
          map((schedule): ScheduleState => ({ status: 'loaded', schedule })),
          catchError(() => of<ScheduleState>({ status: 'failed' })),
          startWith<ScheduleState>({ status: 'loading' }),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as ScheduleState },
  );

  protected readonly selectedDay = computed(() => this.chosenDay() ?? this.today());

  protected readonly days = computed(() => {
    const today = this.today();
    return today ? Array.from({ length: DAYS_OFFERED }, (_, index) => addDays(today, index)) : [];
  });

  /** Last day offered by "Autre date": an aid for the visitor, the API accepts any date. */
  protected readonly lastDay = computed(() => {
    const today = this.today();
    return today ? addOneYear(today) : null;
  });

  protected readonly genres = computed(() => {
    const state = this.state();
    if (state.status !== 'loaded') {
      return [];
    }
    return [...new Set(state.schedule.movies.map((movie) => movie.genre))].sort((a, b) =>
      a.localeCompare(b, 'fr'),
    );
  });

  /** All the movies of the displayed day. */
  protected readonly dayMovies = computed(() => {
    const state = this.state();
    return state.status === 'loaded' ? state.schedule.movies : [];
  });

  /** The movies of the displayed day, in the chosen genre. */
  protected readonly movies = computed(() => {
    const genre = this.genre();
    return genre ? this.dayMovies().filter((movie) => movie.genre === genre) : this.dayMovies();
  });

  protected readonly pageCount = computed(() => pageCount(this.movies().length, MOVIES_PER_PAGE));

  protected readonly pageMovies = computed(() =>
    pageItems(this.movies(), this.page(), MOVIES_PER_PAGE),
  );

  constructor() {
    // A link to a section of the page (/#cinema): scroll once the schedule, and so the whole page, is shown
    inject(ActivatedRoute)
      .fragment.pipe(takeUntilDestroyed())
      .subscribe((fragment) => {
        if (fragment) {
          this.pendingAnchor.set(fragment);
        }
      });

    afterRenderEffect(() => {
      const anchor = this.pendingAnchor();
      if (anchor && this.state().status === 'loaded') {
        this.pendingAnchor.set(null);
        this.scroller.scrollToAnchor(anchor);
      }
    });
  }

  /** "Aujourd'hui, 22 oct." for today when it is chosen, "Aujourd'hui" otherwise, "ven. 23" for the other days. */
  protected dayLabel(day: string, isToday: boolean): string {
    if (!isToday) {
      return formatDate(day, 'EEE d', this.locale);
    }
    return day === this.selectedDay()
      ? `Aujourd'hui, ${formatDate(day, 'd MMM', this.locale)}`
      : "Aujourd'hui";
  }

  protected chooseDay(day: string): void {
    this.genre.set('');
    this.page.set(1);
    this.chosenDay.set(day);
  }

  /** "Autre date": an emptied field changes nothing. */
  protected chooseOtherDay(day: string): void {
    if (day) {
      this.chooseDay(day);
    }
  }

  protected chooseGenre(genre: string): void {
    this.genre.set(genre);
    this.page.set(1);
  }

  protected choosePage(page: number): void {
    this.page.set(page);
    this.pendingAnchor.set('schedule');
  }

  /** Shows the screenings of a movie of the displayed day, on its page, or the whole day when no movie is given. */
  protected find(movieId: string | null): void {
    this.genre.set('');
    const index = this.dayMovies().findIndex((movie) => movie.movieId === movieId);
    this.page.set(index >= 0 ? pageOfIndex(index, MOVIES_PER_PAGE) : 1);
    this.pendingAnchor.set(movieId ? `movie-${movieId}` : 'schedule');
  }
}
