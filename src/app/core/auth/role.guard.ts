import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { User } from './models/auth';

/**
 * Staff pages (US 5.x): signed-out visitors go to the sign-in page, then come back; roles not listed go to the home page.
 * Comfort only: the API answers 403 to the other roles anyway.
 */
export function roleGuard(...roles: User['role'][]): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isSignedIn()) {
      return router.createUrlTree(['/sign-in'], { queryParams: { returnUrl: state.url } });
    }
    const role = auth.user()?.role;
    return role && roles.includes(role) ? true : router.createUrlTree(['/']);
  };
}
