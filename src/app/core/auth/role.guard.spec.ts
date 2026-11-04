import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { AuthService } from './auth.service';
import { User } from './models/auth';
import { roleGuard } from './role.guard';

describe('US 5.2 – roleGuard', () => {
  function check(role: User['role'] | null) {
    const user = role ? ({ role } as User) : null;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { user: signal(user), isSignedIn: signal(user !== null) },
        },
      ],
    });
    return TestBed.runInInjectionContext(() =>
      roleGuard('Manager')(
        {} as ActivatedRouteSnapshot,
        { url: '/programming' } as RouterStateSnapshot,
      ),
    );
  }

  it('when the manager opens a staff page, then it opens', () => {
    expect(check('Manager')).toBe(true);
  });

  it('when another role opens a staff page, then the home page opens', () => {
    const result = check('Cashier') as UrlTree;

    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/');
  });

  it('when the visitor is signed out, then the sign-in page opens and remembers the page asked for', () => {
    const result = check(null) as UrlTree;

    expect(TestBed.inject(Router).serializeUrl(result)).toMatch(/^\/sign-in\?/);
    expect(result.queryParams['returnUrl']).toBe('/programming');
  });
});
