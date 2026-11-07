import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { staffHome } from './roles';

/**
 * Public pages (home, movies): the cashier and the inspector go to their own page instead.
 * Visitors, customers and the manager go on. Comfort only: the API refuses a purchase by the staff (403).
 */
export const staffHomeGuard: CanActivateFn = () => {
  const home = staffHome(inject(AuthService).user()?.role);
  return home ? inject(Router).parseUrl(home) : true;
};
