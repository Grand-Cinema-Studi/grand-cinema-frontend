import { CanActivateFn } from '@angular/router';

/** Public pages: the cashier and the inspector go to their own page instead. */
export const staffHomeGuard: CanActivateFn = () => {
  throw new Error('Step 23b');
};
