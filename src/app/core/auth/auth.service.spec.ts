import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { AuthToken, User } from './models/auth';

describe('US 2.1 – AuthService', () => {
  const lea: User = {
    userId: 'id-lea',
    email: 'lea.martin@example.com',
    firstName: 'Léa',
    lastName: 'Martin',
    role: 'Customer',
  };
  const token = (expiresAt: string): AuthToken => ({
    accessToken: 'jwt-lea',
    expiresAt,
    user: lea,
  });
  const inOneHour = () => new Date(Date.now() + 3_600_000).toISOString();

  function setUp() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return { auth: TestBed.inject(AuthService), http: TestBed.inject(HttpTestingController) };
  }

  beforeEach(() => sessionStorage.clear());

  it('when an account is created, then POST /api/users is called with the privacy policy acceptance and the visitor is signed in', () => {
    const { auth, http } = setUp();
    const request = {
      email: 'lea.martin@example.com',
      password: 'Correct-horse-2026',
      firstName: 'Léa',
      lastName: 'Martin',
      acceptPrivacyPolicy: true,
    };

    auth.register(request).subscribe();

    const call = http.expectOne('/api/users');
    expect(call.request.method).toBe('POST');
    expect(call.request.body).toEqual(request);
    call.flush(token(inOneHour()));
    expect(auth.isSignedIn()).toBe(true);
    expect(auth.user()).toEqual(lea);
    expect(auth.accessToken()).toBe('jwt-lea');
    http.verify();
  });

  it('when the visitor signs in, then POST /api/tokens is called and the session is kept for the tab', () => {
    const { auth, http } = setUp();

    auth.signIn({ email: 'lea.martin@example.com', password: 'Correct-horse-2026' }).subscribe();

    const call = http.expectOne('/api/tokens');
    expect(call.request.method).toBe('POST');
    call.flush(token(inOneHour()));
    expect(sessionStorage.getItem('grand-cinema.session')).toContain('jwt-lea');
    http.verify();
  });

  it('when the tab is reloaded with a session that has not expired, then the visitor is still signed in', () => {
    sessionStorage.setItem('grand-cinema.session', JSON.stringify(token(inOneHour())));

    const { auth } = setUp();

    expect(auth.isSignedIn()).toBe(true);
    expect(auth.user()?.firstName).toBe('Léa');
  });

  it('when the stored session has expired, then the visitor starts signed out', () => {
    sessionStorage.setItem('grand-cinema.session', JSON.stringify(token('2020-01-01T00:00:00Z')));

    const { auth } = setUp();

    expect(auth.isSignedIn()).toBe(false);
  });

  it('when the account is deleted, then DELETE /api/users/me is called and the session is forgotten', () => {
    sessionStorage.setItem('grand-cinema.session', JSON.stringify(token(inOneHour())));
    const { auth, http } = setUp();

    auth.deleteAccount().subscribe();

    const call = http.expectOne('/api/users/me');
    expect(call.request.method).toBe('DELETE');
    call.flush(null, { status: 204, statusText: 'No Content' });
    expect(auth.isSignedIn()).toBe(false);
    expect(sessionStorage.getItem('grand-cinema.session')).toBeNull();
    http.verify();
  });

  it('when the visitor signs out, then the session is forgotten', () => {
    sessionStorage.setItem('grand-cinema.session', JSON.stringify(token(inOneHour())));
    const { auth } = setUp();

    auth.signOut();

    expect(auth.isSignedIn()).toBe(false);
    expect(auth.accessToken()).toBeNull();
    expect(sessionStorage.getItem('grand-cinema.session')).toBeNull();
  });
});
