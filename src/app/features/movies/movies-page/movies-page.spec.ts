import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { Movie } from '../models/movie';
import { MoviesService } from '../movies.service';
import { MoviesPage } from './movies-page';

describe('US 1.1 – MoviesPage', () => {
  async function render(getMoviesShowing: () => Observable<Movie[]>) {
    TestBed.configureTestingModule({
      imports: [MoviesPage],
      providers: [provideRouter([]), { provide: MoviesService, useValue: { getMoviesShowing } }],
    });
    const fixture = TestBed.createComponent(MoviesPage);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('when movies are showing, then each one is shown in the order of the api', async () => {
    const movies: Movie[] = ['1917', 'Blue Note'].map((title) => ({
      movieId: `id-${title}`,
      title,
      synopsis: '',
      durationMinutes: 110,
      genre: 'Drame',
      releaseDate: '2020-01-01',
      posterUrl: `https://posters.test/${title}.jpg`,
    }));

    const element = await render(() => of(movies));

    const titles = Array.from(element.querySelectorAll('article h3'), (title) =>
      title.textContent?.trim(),
    );
    expect(titles).toEqual(['1917', 'Blue Note']);
  });

  it('when no movie is showing, then an explicit message is shown', async () => {
    const element = await render(() => of([]));

    expect(element.textContent).toContain("Aucun film n'est à l'affiche pour le moment.");
  });

  it('when the api fails, then an error message is shown', async () => {
    const element = await render(() => throwError(() => new Error('Network error')));

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Les films sont momentanément indisponibles.',
    );
  });
});
