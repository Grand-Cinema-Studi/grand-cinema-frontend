import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateMovieRequest,
  CreateScreeningRequest,
  Programming,
  UpdateMovieRequest,
  UpdateScreeningRequest,
} from './models/programming';

/** US 5.2: the API answers 403 to every role but the manager. */
@Injectable({ providedIn: 'root' })
export class ProgrammingService {
  private readonly http = inject(HttpClient);

  /** Without a date, the API returns the programming of today. */
  getProgramming(date?: string): Observable<Programming> {
    const params = date ? new HttpParams().set('date', date) : undefined;
    return this.http.get<Programming>('/api/programming', { params });
  }

  createScreening(request: CreateScreeningRequest): Observable<{ screeningId: string }> {
    return this.http.post<{ screeningId: string }>('/api/programming/screenings', request);
  }

  /**
   * US 5.6: multipart/form-data, the poster as a file. No content type is set here:
   * the browser writes it with the boundary between the fields.
   */
  createMovie(request: CreateMovieRequest): Observable<{ movieId: string }> {
    return this.http.post<{ movieId: string }>('/api/programming/movies', movieForm(request));
  }

  /** US 5.6: the same form as createMovie; without a new poster, the poster does not change. */
  updateMovie(movieId: string, request: UpdateMovieRequest): Observable<void> {
    return this.http.put<void>(`/api/programming/movies/${movieId}`, movieForm(request));
  }

  /** US 5.6: never deleted; 409 "movie-has-screenings" while a screening of the movie has not ended. */
  archiveMovie(movieId: string): Observable<void> {
    return this.http.post<void>(`/api/programming/movies/${movieId}/archive`, null);
  }

  /** 409 "screening-has-reservations" while seats are taken and the change is not confirmed. */
  updateScreening(
    id: string,
    request: UpdateScreeningRequest,
    confirmed: boolean,
  ): Observable<void> {
    return this.http.put<void>(`/api/programming/screenings/${id}`, request, {
      params: confirmation(confirmed),
    });
  }

  /** Same warning as updateScreening. */
  cancelScreening(id: string, confirmed: boolean): Observable<void> {
    return this.http.delete<void>(`/api/programming/screenings/${id}`, {
      params: confirmation(confirmed),
    });
  }
}

function confirmation(confirmed: boolean): HttpParams | undefined {
  return confirmed ? new HttpParams().set('confirmed', 'true') : undefined;
}

/** The fields of a movie; the poster only when there is one. */
function movieForm(request: CreateMovieRequest | UpdateMovieRequest): FormData {
  const form = new FormData();
  form.append('title', request.title);
  form.append('synopsis', request.synopsis);
  form.append('durationMinutes', String(request.durationMinutes));
  form.append('genre', request.genre);
  form.append('releaseDate', request.releaseDate);
  if (request.poster) {
    form.append('poster', request.poster);
  }
  return form;
}
