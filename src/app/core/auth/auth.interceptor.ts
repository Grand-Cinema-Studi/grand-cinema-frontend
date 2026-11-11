import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** Sends the access token with every call to the API, and forgets the session when the API refuses it. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken();
  if (!token || !request.url.startsWith('/api/')) {
    return next(request);
  }

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((error: unknown) => {
      // Expired or invalid token: the visitor is shown as signed out instead of failing on every page
      if (error instanceof HttpErrorResponse && error.status === 401) {
        auth.signOut();
      }
      return throwError(() => error);
    }),
  );
};
