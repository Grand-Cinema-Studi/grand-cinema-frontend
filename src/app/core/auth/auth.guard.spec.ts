import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('US 2.1 – authGuard', () => {
  function check(signedIn: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isSignedIn: signal(signedIn) } },
      ],
    });
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/account' } as RouterStateSnapshot),
    );
  }

  it('when the visitor is signed in, then the page opens', () => {
    expect(check(true)).toBe(true);
  });

  it('when the visitor is signed out, then the sign-in page opens and remembers the page asked for', () => {
    const result = check(false) as UrlTree;

    expect(TestBed.inject(Router).serializeUrl(result)).toMatch(/^\/sign-in\?/);
    expect(result.queryParams['returnUrl']).toBe('/account');
  });
});
