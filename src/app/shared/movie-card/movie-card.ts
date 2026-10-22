import { Component, input } from '@angular/core';
import { RuntimePipe } from '../runtime.pipe';

@Component({
  imports: [RuntimePipe],
  selector: 'app-movie-card',
  templateUrl: './movie-card.html',
})
export class MovieCard {
  readonly title = input.required<string>();
  readonly posterUrl = input.required<string>();
  readonly genre = input.required<string>();
  readonly durationMinutes = input.required<number>();
}
