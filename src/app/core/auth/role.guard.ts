import { CanActivateFn } from '@angular/router';
import { User } from './models/auth';

export function roleGuard(_role: User['role']): CanActivateFn {
  return () => {
    throw new Error('Step 17a');
  };
}
