import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { PrivacyPolicyPage } from './privacy-policy-page';

describe('US 2.1 – PrivacyPolicyPage', () => {
  async function render(): Promise<HTMLElement> {
    registerLocaleData(localeFr);
    TestBed.configureTestingModule({
      imports: [PrivacyPolicyPage],
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'fr' }],
    });
    const fixture = TestBed.createComponent(PrivacyPolicyPage);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('when the policy is displayed, then its version is the one the api records with each new account', async () => {
    const element = await render();

    expect(element.textContent).toContain('Version du 28 octobre 2026');
  });

  it('when the policy is displayed, then it tells how to delete the account', async () => {
    const element = await render();

    expect(element.textContent).toContain('supprimer votre compte');
    expect(element.querySelector('a[href="/account"]')).not.toBeNull();
  });
});
