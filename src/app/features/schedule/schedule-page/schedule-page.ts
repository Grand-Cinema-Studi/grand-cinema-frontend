import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap, tap } from 'rxjs';
import { MovieCard } from '../../../shared/movie-card/movie-card';
import { Schedule } from '../models/schedule';
import { ScheduleService } from '../schedule.service';

type ScheduleState =
  { status: 'loading' } | { status: 'loaded'; schedule: Schedule } | { status: 'failed' };

const DAYS_OFFERED = 7;

/** Adds days to a "yyyy-MM-dd" day, without time zone: the result is the calendar day that follows. */
function addDays(day: string, count: number): string {
  const [year, month, date] = day.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, date + count));
  return next.toISOString().slice(0, 10);
}

@Component({
  imports: [DatePipe, MovieCard, RouterLink],
  selector: 'app-schedule-page',
  templateUrl: './schedule-page.html',
})
export class SchedulePage {
  private readonly scheduleService = inject(ScheduleService);

  /** Day chosen by the visitor; undefined until a day is chosen, so that the API decides what "today" is. */
  private readonly chosenDay = signal<string | undefined>(undefined);
  /** Today in the time zone of the cinema, as returned by the API on the first load. */
  protected readonly today = signal<string | null>(null);
  protected readonly genre = signal('');

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

  protected readonly genres = computed(() => {
    const state = this.state();
    if (state.status !== 'loaded') {
      return [];
    }
    return [...new Set(state.schedule.movies.map((movie) => movie.genre))].sort((a, b) =>
      a.localeCompare(b, 'fr'),
    );
  });

  protected readonly movies = computed(() => {
    const state = this.state();
    if (state.status !== 'loaded') {
      return [];
    }
    const genre = this.genre();
    return genre
      ? state.schedule.movies.filter((movie) => movie.genre === genre)
      : state.schedule.movies;
  });

  protected chooseDay(day: string): void {
    this.genre.set('');
    this.chosenDay.set(day);
  }

  protected chooseGenre(genre: string): void {
    this.genre.set(genre);
  }
}
