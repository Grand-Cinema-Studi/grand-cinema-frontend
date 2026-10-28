import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { AuthToken, AuthenticateUserRequest, RegisterUserRequest, User } from './models/auth';

const SESSION_KEY = 'grand-cinema.session';

/**
 * The session of the signed-in visitor: the access token (JWT) and its user.
 * Kept in sessionStorage: it survives a reload of the tab, and is forgotten when the tab is closed (ADR 0002).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = signal<AuthToken | null>(readStoredSession());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly isSignedIn = computed(() => this.session() !== null);

  accessToken(): string | null {
    return this.session()?.accessToken ?? null;
  }

  register(request: RegisterUserRequest): Observable<User> {
    return this.http.post<AuthToken>('/api/users', request).pipe(
      tap((token) => this.start(token)),
      map((token) => token.user),
    );
  }

  signIn(request: AuthenticateUserRequest): Observable<User> {
    return this.http.post<AuthToken>('/api/tokens', request).pipe(
      tap((token) => this.start(token)),
      map((token) => token.user),
    );
  }

  getProfile(): Observable<User> {
    return this.http.get<User>('/api/users/me');
  }

  /** GDPR right to erasure: the API deletes the account, then the session is forgotten. */
  deleteAccount(): Observable<void> {
    return this.http.delete<void>('/api/users/me').pipe(tap(() => this.signOut()));
  }

  signOut(): void {
    this.session.set(null);
    sessionStorage.removeItem(SESSION_KEY);
  }

  private start(token: AuthToken): void {
    this.session.set(token);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(token));
  }
}

function readStoredSession(): AuthToken | null {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    const token = stored ? (JSON.parse(stored) as AuthToken) : null;
    // An expired token would only bring 401 answers: the visitor starts signed out
    return token && new Date(token.expiresAt).getTime() > Date.now() ? token : null;
  } catch {
    return null;
  }
}
