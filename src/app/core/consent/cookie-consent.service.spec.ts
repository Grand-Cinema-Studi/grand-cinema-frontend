import { TestBed } from '@angular/core/testing';
import { CookieConsentService } from './cookie-consent.service';

describe('US 1.2 – CookieConsentService', () => {
  const key = 'grand-cinema.cookie-consent';

  beforeEach(() => localStorage.clear());

  it('when the visitor chooses, then the choice is kept for the next visit', () => {
    TestBed.inject(CookieConsentService).choose('refused');

    // Next visit: a new application, the same browser
    TestBed.resetTestingModule();
    expect(TestBed.inject(CookieConsentService).choice()).toBe('refused');
  });

  it('when the choice is more than 6 months old, then it is asked again', () => {
    const sevenMonthsAgo = new Date();
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);
    localStorage.setItem(
      key,
      JSON.stringify({ choice: 'accepted', at: sevenMonthsAgo.toISOString() }),
    );

    expect(TestBed.inject(CookieConsentService).choice()).toBeNull();
  });
});
