import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { User } from './models/auth';

/**
 * Staff pages (US 5.x): signed-out visitors go to the sign-in page, then come back; other roles go to the home page.
 * Comfort only: the API answers 403 to the other roles anyway.
 */
export function roleGuard(...roles: User['role'][]): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isSignedIn()) {
      return router.createUrlTree(['/sign-in'], { queryParams: { returnUrl: state.url } });
    }
    return auth.user()?.role === roles[0] ? true : router.createUrlTree(['/']);
  };
}
