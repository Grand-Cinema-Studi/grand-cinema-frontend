import { Injectable, signal } from '@angular/core';

export type CookieChoice = 'accepted' | 'refused';

interface StoredChoice {
  choice: CookieChoice;
  at: string;
}

const KEY = 'grand-cinema.cookie-consent';
/** The choice is asked again after 6 months, as the CNIL recommends. */
const VALID_MONTHS = 6;

function readChoice(): CookieChoice | null {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? 'null') as StoredChoice | null;
    if (!stored) {
      return null;
    }
    const limit = new Date(stored.at);
    limit.setMonth(limit.getMonth() + VALID_MONTHS);
    return limit > new Date() ? stored.choice : null;
  } catch {
    // Unreadable value or blocked storage: ask again
    return null;
  }
}

/**
 * US 1.2: the choice of the visitor on non-essential cookies. The MVP sets none: a tool added later
 * (audience measurement) loads only when the choice is 'accepted'. Keeping the choice itself is
 * strictly necessary, so it needs no consent.
 */
@Injectable({ providedIn: 'root' })
export class CookieConsentService {
  /** The choice of the visitor, or null until they have chosen: the banner shows while it is null. */
  readonly choice = signal<CookieChoice | null>(readChoice());

  choose(choice: CookieChoice): void {
    this.choice.set(choice);
    try {
      localStorage.setItem(KEY, JSON.stringify({ choice, at: new Date().toISOString() }));
    } catch {
      // Storage blocked by the browser: the choice holds for this visit only
    }
  }

  /** From the footer: the visitor changes their mind, and the banner shows again. */
  reset(): void {
    this.choice.set(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      // Nothing stored, nothing to forget
    }
  }
}
