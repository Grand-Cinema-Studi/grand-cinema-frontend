import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CookieBanner } from './cookie-banner';

describe('US 1.2 – CookieBanner', () => {
  beforeEach(() => localStorage.clear());

  async function render() {
    TestBed.configureTestingModule({ imports: [CookieBanner], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(CookieBanner);
    await fixture.whenStable();
    return { element: fixture.nativeElement as HTMLElement, fixture };
  }

  it('when the visitor has not chosen yet, then the banner offers to refuse or to accept, and hides once they refuse', async () => {
    const { element, fixture } = await render();

    const buttons = Array.from(element.querySelectorAll('button'), (button) =>
      button.textContent?.trim(),
    );
    expect(buttons).toEqual(['Tout refuser', 'Tout accepter']);

    element.querySelector<HTMLButtonElement>('button')?.click();
    await fixture.whenStable();

    expect(element.querySelector('[aria-labelledby="cookie-banner-title"]')).toBeNull();
    expect(localStorage.getItem('grand-cinema.cookie-consent')).toContain('refused');
  });

  it('when the visitor has already chosen, then no banner is shown', async () => {
    localStorage.setItem(
      'grand-cinema.cookie-consent',
      JSON.stringify({ choice: 'accepted', at: new Date().toISOString() }),
    );

    const { element } = await render();

    expect(element.querySelector('[aria-labelledby="cookie-banner-title"]')).toBeNull();
  });
});
