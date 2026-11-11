import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MovieCard } from './movie-card';

@Component({
  imports: [MovieCard],
  template: `
    <app-movie-card
      movieId="id-metropolis"
      title="Metropolis"
      posterUrl="https://posters.test/metropolis.jpg"
      genre="Science-fiction"
      [durationMinutes]="153"
    >
      <p>showtimes</p>
    </app-movie-card>
  `,
})
class Host {}

describe('MovieCard', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('when a movie is given, then its poster, title, genre, running time and projected content are shown', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('img')?.getAttribute('src')).toBe(
      'https://posters.test/metropolis.jpg',
    );
    expect(element.querySelector('h3')?.textContent?.trim()).toBe('Metropolis');
    expect(element.textContent).toContain('Science-fiction');
    expect(element.textContent).toContain('2h 33m');
    expect(element.textContent).toContain('showtimes');
  });

  it('when a movie is given, then its poster and its title open the movie page', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const link = (fixture.nativeElement as HTMLElement).querySelector('a');
    expect(link?.getAttribute('href')).toBe('/movies/id-metropolis');
    expect(link?.querySelector('img')).not.toBeNull();
    expect(link?.querySelector('h3')?.textContent?.trim()).toBe('Metropolis');
  });
});
