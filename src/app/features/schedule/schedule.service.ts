import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Schedule } from './models/schedule';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly http = inject(HttpClient);

  /** Without a date, the API returns the schedule of today, in the time zone of the cinema. */
  getSchedule(date?: string): Observable<Schedule> {
    const params = date ? new HttpParams().set('date', date) : undefined;
    return this.http.get<Schedule>('/api/schedule', { params });
  }
}
