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
import { staffHomeGuard } from './staff-home.guard';

describe('staffHomeGuard', () => {
  function open(role: User['role'] | null) {
    const user = role ? ({ role } as User) : null;
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { user: signal(user) } }],
    });
    const result = TestBed.runInInjectionContext(() =>
      staffHomeGuard({} as ActivatedRouteSnapshot, { url: '/' } as RouterStateSnapshot),
    );
    return result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : result;
  }

  it('when the cashier or the inspector opens a public page, then their own page opens instead', () => {
    expect(open('Cashier')).toBe('/tracking');
    expect(open('TicketInspector')).toBe('/ticket-check');
  });

  it('when a visitor, a customer or the manager opens a public page, then it opens', () => {
    expect(open(null)).toBe(true);
    expect(open('Customer')).toBe(true);
    expect(open('Manager')).toBe(true);
  });
});
