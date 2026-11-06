import { Injectable, signal } from '@angular/core';

export type CookieChoice = 'accepted' | 'refused';

@Injectable({ providedIn: 'root' })
export class CookieConsentService {
  /** The choice of the visitor, or null until they have chosen: the banner shows while it is null. */
  readonly choice = signal<CookieChoice | null>(null);

  choose(choice: CookieChoice): void {
    throw new Error(`Step 20 a: ${choice}`);
  }

  /** From the footer: the visitor changes their mind, and the banner shows again. */
  reset(): void {
    throw new Error('Step 20 a');
  }
}
