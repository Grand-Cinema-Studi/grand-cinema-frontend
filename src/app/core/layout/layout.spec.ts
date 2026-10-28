import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Layout } from './layout';

describe('Layout', () => {
  async function render(signedIn = false): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      imports: [Layout],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isSignedIn: signal(signedIn) } },
      ],
    });
    const fixture = TestBed.createComponent(Layout);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('when the layout is displayed, then the header shows the cinema name', async () => {
    const element = await render();

    expect(element.querySelector('header')?.textContent).toContain('Grand Cinéma');
  });

  it('when the layout is displayed, then the pages are shown between the header and the footer', async () => {
    const element = await render();

    expect(element.querySelector('main router-outlet')).not.toBeNull();
    expect(element.querySelector('footer')).not.toBeNull();
  });

  it('when the layout is displayed, then the footer leads to the sections of the home page', async () => {
    const element = await render();

    const groups = Array.from(element.querySelectorAll('footer h2'), (title) =>
      title.textContent?.trim(),
    );
    expect(groups).toEqual(['Nos salles', 'Grand Cinéma', 'À propos']);
    const links = Array.from(element.querySelectorAll<HTMLAnchorElement>('footer a'), (link) => [
      link.textContent?.trim(),
      link.getAttribute('href'),
    ]);
    expect(links).toEqual([
      ["À l'affiche", '/#schedule'],
      ['Prochainement', '/#featured'],
      ['Notre cinéma', '/#cinema'],
      ['Contact', null],
      ['À propos', null],
      ['Politique de confidentialité', '/privacy-policy'],
    ]);
  });

  it('when the layout is displayed, then the footer shows the social networks and the legal mentions', async () => {
    const element = await render();

    const networks = Array.from(element.querySelectorAll('footer img[alt]'), (icon) =>
      icon.getAttribute('alt'),
    ).filter(Boolean);
    expect(networks).toEqual(['Instagram', 'Facebook', 'YouTube']);
    const footer = element.querySelector('footer')?.textContent;
    expect(footer).toContain('Politique de confidentialité');
    expect(footer).toContain('Termes & conditions');
    expect(footer).toContain('Cookies');
    expect(footer).toContain('© 2026 Grand Cinéma. Tous droits réservés.');
  });

  it('when the visitor is signed out, then the header leads to the sign-in page', async () => {
    const element = await render(false);

    const link = element.querySelector<HTMLAnchorElement>('header a[href="/sign-in"]');
    expect(link?.textContent?.trim()).toBe('Connexion');
  });

  it('when the visitor is signed in, then the header leads to the account page', async () => {
    const element = await render(true);

    const link = element.querySelector<HTMLAnchorElement>('header a[href="/account"]');
    expect(link?.textContent?.trim()).toBe('Mon compte');
    expect(element.querySelector('header a[href="/sign-in"]')).toBeNull();
  });
});
