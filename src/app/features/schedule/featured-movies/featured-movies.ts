import { Component, computed, input, linkedSignal } from '@angular/core';
import { RuntimePipe } from '../../../shared/runtime.pipe';
import { MovieSchedule } from '../models/schedule';

/** Beyond this length, the title is set smaller so that it stays on two or three lines. */
const LONG_TITLE = 16;

@Component({
  imports: [RuntimePipe],
  selector: 'app-featured-movies',
  templateUrl: './featured-movies.html',
})
export class FeaturedMovies {
  readonly movies = input.required<MovieSchedule[]>();

  /** Back to the first movie whenever the list changes. */
  protected readonly index = linkedSignal({ source: this.movies, computation: () => 0 });
  protected readonly movie = computed(() => this.movies()[this.index()]);
  protected readonly longTitle = computed(() => this.movie().title.length > LONG_TITLE);
  protected readonly progress = computed(() => ((this.index() + 1) / this.movies().length) * 100);

  protected position(value: number): string {
    return String(value).padStart(2, '0');
  }

  protected previous(): void {
    const count = this.movies().length;
    this.index.update((index) => (index - 1 + count) % count);
  }

  protected next(): void {
    this.index.update((index) => (index + 1) % this.movies().length);
  }
}
