import { Injectable } from '@angular/core';

/** Leaves the application for another site (the payment page of Stripe): replaced by a double in the tests. */
@Injectable({ providedIn: 'root' })
export class ExternalNavigation {
  go(url: string): void {
    window.location.assign(url);
  }
}
