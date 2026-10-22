import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Layout } from './layout';

describe('Layout', () => {
  async function render(): Promise<HTMLElement> {
    TestBed.configureTestingModule({ imports: [Layout], providers: [provideRouter([])] });
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
});
