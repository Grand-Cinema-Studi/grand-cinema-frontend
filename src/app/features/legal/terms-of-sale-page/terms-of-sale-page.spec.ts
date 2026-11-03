import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TermsOfSalePage } from './terms-of-sale-page';

describe('US 3.1 – TermsOfSalePage', () => {
  async function render(): Promise<HTMLElement> {
    registerLocaleData(localeFr);
    TestBed.configureTestingModule({
      imports: [TermsOfSalePage],
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'fr' }],
    });
    const fixture = TestBed.createComponent(TermsOfSalePage);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('when the terms of sale are displayed, then their version and the absence of a withdrawal right are shown', async () => {
    const element = await render();

    expect(element.textContent).toContain('Version du 2 novembre 2026');
    expect(element.textContent).toContain('droit de rétractation');
  });
});
