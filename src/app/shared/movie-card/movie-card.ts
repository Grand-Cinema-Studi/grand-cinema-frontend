import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RuntimePipe } from '../runtime.pipe';

@Component({
  imports: [RouterLink, RuntimePipe],
  selector: 'app-movie-card',
  templateUrl: './movie-card.html',
})
export class MovieCard {
  readonly movieId = input.required<string>();
  readonly title = input.required<string>();
  readonly posterUrl = input.required<string>();
  readonly genre = input.required<string>();
  readonly durationMinutes = input.required<number>();
}
