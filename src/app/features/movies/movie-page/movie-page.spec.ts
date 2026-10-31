import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ReservationsService } from '../../reservations/reservations.service';
import { MovieDetails, ScreeningDay } from '../models/movie-details';
import { MoviesService } from '../movies.service';
import { MoviePage } from './movie-page';

const BIRD_ID = '22222222-2222-2222-2222-000000000005';

function day(date: string, remainingSeats: number[]): ScreeningDay {
  return {
    date,
    screenings: remainingSeats.map((seats, index) => ({
      screeningId: `${date}-${index}`,
      roomName: `Salle ${index + 1}`,
      startsAt: `${date}T${index === 0 ? '14:30' : '20:30'}:00`,
      price: 9.5,
      remainingSeats: seats,
    })),
  };
}

function bird(days: ScreeningDay[]): MovieDetails {
  return {
    movieId: BIRD_ID,
    title: 'Bird',
    synopsis: 'The life of Charlie Parker.',
    durationMinutes: 161,
    genre: 'Drame',
    releaseDate: '1988-09-30',
    posterUrl: 'https://posters.test/bird.jpg',
    days,
  };
}

describe('US 1.1 – MoviePage', () => {
  async function render(
    getMovieDetails: (movieId: string) => Observable<MovieDetails>,
    movieId = BIRD_ID,
  ) {
    const service = { getMovieDetails: vi.fn(getMovieDetails) };
    TestBed.configureTestingModule({
      imports: [MoviePage],
      providers: [
        provideRouter([]),
        { provide: MoviesService, useValue: service },
        { provide: AuthService, useValue: { isSignedIn: signal(false) } },
        { provide: ReservationsService, useValue: {} },
      ],
    });
    const fixture = TestBed.createComponent(MoviePage);
    fixture.componentRef.setInput('movieId', movieId);
    await fixture.whenStable();
    return { element: fixture.nativeElement as HTMLElement, fixture, service };
  }

  const shownDays = (element: HTMLElement) =>
    Array.from(
      element.querySelectorAll<HTMLElement>('[data-date]'),
      (shown) => shown.dataset['date'],
    );

  const moreDates = (element: HTMLElement) =>
    Array.from(element.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Voir les dates suivantes',
    );

  it('when a movie is opened, then its details and its screenings are shown day by day, with their remaining seats', async () => {
    const { element, service } = await render(() =>
      of(bird([day('2026-10-31', [42, 0]), day('2027-10-30', [120])])),
    );

    expect(service.getMovieDetails).toHaveBeenCalledWith(BIRD_ID);
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Bird');
    expect(element.textContent).toContain('2h 41m');
    expect(element.textContent).toContain('The life of Charlie Parker.');
    expect(shownDays(element)).toEqual(['2026-10-31', '2027-10-30']);
    const firstDay = element.querySelector('[data-date="2026-10-31"]');
    expect(firstDay?.textContent).toContain('14:30');
    expect(firstDay?.textContent).toContain('42 places');
    expect(firstDay?.textContent).toContain('Complet');
  });

  it('when the movie has more than seven days of screenings, then the first seven are shown, then the following ones on demand', async () => {
    const dates = Array.from(
      { length: 10 },
      (_, index) => `2026-11-${String(index + 1).padStart(2, '0')}`,
    );
    const { element, fixture } = await render(() => of(bird(dates.map((date) => day(date, [50])))));

    expect(shownDays(element)).toEqual(dates.slice(0, 7));

    moreDates(element)?.click();
    await fixture.whenStable();

    expect(shownDays(element)).toEqual(dates);
    expect(moreDates(element)).toBeUndefined();
  });

  it('when the movie has no upcoming screening, then an explicit message is shown', async () => {
    const { element } = await render(() => of(bird([])));

    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Bird');
    expect(element.textContent).toContain("Aucune séance n'est programmée pour ce film.");
    expect(moreDates(element)).toBeUndefined();
  });

  it('when the movie does not exist, then "film introuvable" is shown with a link to all the movies', async () => {
    const { element } = await render(() =>
      throwError(
        () => new HttpErrorResponse({ status: 404, error: { type: '/errors/movie-not-found' } }),
      ),
    );

    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Film introuvable');
    expect(element.querySelector('a[href="/movies"]')).not.toBeNull();
  });

  it('when the address is not a movie identifier, then "film introuvable" is shown without calling the api', async () => {
    const { element, service } = await render(() => of(bird([])), 'not-a-movie');

    expect(service.getMovieDetails).not.toHaveBeenCalled();
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Film introuvable');
  });

  it('when the api fails, then an error message is shown', async () => {
    const { element } = await render(() =>
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Le film est momentanément indisponible.',
    );
  });

  it('when a screening is chosen, then its booking form is shown', async () => {
    const { element, fixture } = await render(() => of(bird([day('2026-10-31', [42, 0])])));
    expect(element.querySelector('app-hold-form')).toBeNull();

    fixture.componentRef.setInput('screening', '2026-10-31-0');
    await fixture.whenStable();

    expect(element.querySelector('app-hold-form')?.textContent).toContain('Salle 1');
  });
});
