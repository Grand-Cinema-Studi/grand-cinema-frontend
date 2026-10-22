import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Movie } from './models/movie';

@Injectable({ providedIn: 'root' })
export class MoviesService {
  private readonly http = inject(HttpClient);

  getMoviesShowing(): Observable<Movie[]> {
    return this.http.get<Movie[]>('/api/movies');
  }
}
