import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MovieSchedule } from '../models/schedule';
import { FeaturedMovies } from './featured-movies';

function movie(title: string): MovieSchedule {
  return {
    movieId: `id-${title}`,
    title,
    synopsis: `Synopsis of ${title}`,
    durationMinutes: 148,
    genre: 'Science-fiction',
    releaseDate: '2020-01-01',
    posterUrl: `https://posters.test/${title}.jpg`,
    screenings: [],
  };
}

@Component({
  imports: [FeaturedMovies],
  template: `<app-featured-movies [movies]="movies()" />`,
})
class Host {
  readonly movies = signal([movie('Alien'), movie('Blade Runner'), movie('Vertigo')]);
}

describe('US 1.1 – FeaturedMovies', () => {
  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const click = async (label: string) => {
      element.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)?.click();
      await fixture.whenStable();
    };
    const title = () => element.querySelector('h2')?.textContent?.trim();
    return { element, fixture, click, title };
  }

  it('when movies are given, then the first one is featured with its genre, running time and synopsis', async () => {
    const { element, title } = await render();

    expect(title()).toBe('Alien');
    expect(element.textContent).toContain('Science-fiction');
    expect(element.textContent).toContain('2h 28m');
    expect(element.textContent).toContain('Synopsis of Alien');
    expect(element.textContent).toContain('01');
    expect(element.textContent).toContain('03');
  });

  it('when "next" is pressed, then the following movie is featured, and the first one comes back after the last', async () => {
    const { click, title } = await render();

    await click('Film suivant');
    expect(title()).toBe('Blade Runner');
    await click('Film suivant');
    await click('Film suivant');
    expect(title()).toBe('Alien');
  });

  it('when "previous" is pressed on the first movie, then the last one is featured', async () => {
    const { click, title } = await render();

    await click('Film précédent');

    expect(title()).toBe('Vertigo');
  });
});
