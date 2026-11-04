import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateScreeningRequest, Programming, UpdateScreeningRequest } from './models/programming';

@Injectable({ providedIn: 'root' })
export class ProgrammingService {
  getProgramming(_date?: string): Observable<Programming> {
    throw new Error('Step 17b');
  }

  createScreening(_request: CreateScreeningRequest): Observable<{ screeningId: string }> {
    throw new Error('Step 17b');
  }

  updateScreening(
    _id: string,
    _request: UpdateScreeningRequest,
    _confirmed: boolean,
  ): Observable<void> {
    throw new Error('Step 17b');
  }

  cancelScreening(_id: string, _confirmed: boolean): Observable<void> {
    throw new Error('Step 17b');
  }
}
