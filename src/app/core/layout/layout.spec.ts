import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { User } from '../auth/models/auth';
import { Layout } from './layout';

describe('Layout', () => {
  const lea: User = {
    userId: 'id-lea',
    email: 'lea.martin@example.com',
    firstName: 'Léa',
    lastName: 'Martin',
    role: 'Customer',
  };

  async function render(user: User | null = null): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      imports: [Layout],
      providers: [
        provideRouter([]),
        // Same signals as AuthService: the signed-in user, or null
        {
          provide: AuthService,
          useValue: { user: signal(user), isSignedIn: signal(user !== null) },
        },
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
    const element = await render(null);

    const link = element.querySelector<HTMLAnchorElement>('header a[href="/sign-in"]');
    expect(link?.textContent?.trim()).toBe('Connexion');
  });

  it('when the visitor is signed in, then the header shows the first name and leads to the account page', async () => {
    const element = await render(lea);

    const link = element.querySelector<HTMLAnchorElement>('header a[href="/account"]');
    // "Mon compte :" is only read by screen readers: the visible text is the first name
    expect(link?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Mon compte : Léa');
    expect(element.querySelector('header a[href="/sign-in"]')).toBeNull();
  });
});
