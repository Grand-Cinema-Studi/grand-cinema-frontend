import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('US 2.1 – authInterceptor', () => {
  function setUp(token: string | null) {
    const auth = { accessToken: () => token, signOut: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    });
    return {
      auth,
      client: TestBed.inject(HttpClient),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it('when the visitor is signed in, then calls to the api carry the access token', () => {
    const { client, http } = setUp('jwt-lea');

    client.get('/api/users/me').subscribe();

    expect(http.expectOne('/api/users/me').request.headers.get('Authorization')).toBe(
      'Bearer jwt-lea',
    );
    http.verify();
  });

  it('when the visitor is signed out, then calls to the api carry no token', () => {
    const { client, http } = setUp(null);

    client.get('/api/schedule').subscribe();

    expect(http.expectOne('/api/schedule').request.headers.has('Authorization')).toBe(false);
    http.verify();
  });

  it('when the api refuses the token, then the session is forgotten', () => {
    const { auth, client, http } = setUp('expired-jwt');

    client.get('/api/users/me').subscribe({ error: () => undefined });

    http.expectOne('/api/users/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(auth.signOut).toHaveBeenCalled();
    http.verify();
  });
});
