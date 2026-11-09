import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { Programming } from '../models/programming';
import { ProgrammingService } from '../programming.service';
import { ProgrammingPage } from './programming-page';

// A day far in the future (nothing has started) and one far in the past (everything has started)
function day(date: string, takenSeats = 0): Programming {
  return {
    date,
    screenings: [
      {
        screeningId: 'id-bird',
        movieId: 'id-movie-bird',
        movieTitle: 'Bird',
        roomId: 'id-salle-1',
        roomName: 'Salle 1',
        startsAt: `${date}T20:30:00`,
        price: 9.5,
        takenSeats,
        capacity: 170,
      },
    ],
    movies: [
      {
        movieId: 'id-movie-bird',
        title: 'Bird',
        durationMinutes: 161,
        synopsis: 'Charlie Parker',
        genre: 'Biopic',
        releaseDate: '1988-09-30',
        posterUrl: '/posters/bird.png',
      },
      {
        movieId: 'id-movie-metropolis',
        title: 'Metropolis',
        durationMinutes: 153,
        synopsis: 'Fritz Lang',
        genre: 'Science-fiction',
        releaseDate: '1927-01-10',
        posterUrl: '/posters/metropolis.png',
      },
    ],
    rooms: [
      { roomId: 'id-salle-1', name: 'Salle 1', capacity: 170 },
      { roomId: 'id-salle-2', name: 'Salle 2', capacity: 300 },
    ],
    genres: ['Biopic', 'Drame', 'Science-fiction'],
  };
}

const conflict = (type: string) =>
  throwError(() => new HttpErrorResponse({ status: 409, error: { type } }));
const minuit = new File([new Uint8Array(10)], 'minuit.png', { type: 'image/png' });

describe('US 5.2 – ProgrammingPage', () => {
  afterEach(() => vi.useRealTimers());

  async function render(
    options: {
      programming?: Programming;
      createScreening?: () => Observable<{ screeningId: string }>;
      updateScreening?: () => Observable<void>;
      cancelScreening?: (id: string, confirmed: boolean) => Observable<void>;
      createMovie?: () => Observable<{ movieId: string }>;
      updateMovie?: () => Observable<void>;
      archiveMovie?: () => Observable<void>;
    } = {},
  ) {
    const service = {
      getProgramming: vi.fn(() => of(options.programming ?? day('2032-03-15'))),
      createScreening: vi.fn(options.createScreening ?? (() => of({ screeningId: 'id-new' }))),
      updateScreening: vi.fn(options.updateScreening ?? (() => of(undefined))),
      cancelScreening: vi.fn(options.cancelScreening ?? (() => of(undefined))),
      createMovie: vi.fn(options.createMovie ?? (() => of({ movieId: 'id-movie-new' }))),
      updateMovie: vi.fn(options.updateMovie ?? (() => of(undefined))),
      archiveMovie: vi.fn(options.archiveMovie ?? (() => of(undefined))),
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ProgrammingService, useValue: service }],
    });
    const fixture = TestBed.createComponent(ProgrammingPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    const fill = async (form: HTMLElement, name: string, value: string) => {
      const field = form.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`)!;
      field.value = value;
      field.dispatchEvent(new Event(field instanceof HTMLSelectElement ? 'change' : 'input'));
      await fixture.whenStable();
    };
    const click = async (label: string) => {
      const button = Array.from(element.querySelectorAll('button')).find(
        (candidate) => candidate.textContent?.trim() === label,
      );
      button?.click();
      await fixture.whenStable();
    };
    const choose = async (form: HTMLElement, file: File) => {
      const field = form.querySelector<HTMLInputElement>('[name="poster"]')!;
      Object.defineProperty(field, 'files', { value: [file] });
      field.dispatchEvent(new Event('change'));
      await fixture.whenStable();
    };

    return { element, service, fill, click, choose, fixture };
  }

  it('when the page opens, then the screenings of the day are shown with their taken seats', async () => {
    const { element, service } = await render({ programming: day('2032-03-15', 42) });

    expect(service.getProgramming).toHaveBeenCalledWith(undefined);
    const row = element.querySelector('[data-screening="id-bird"]');
    expect(row?.textContent).toContain('20:30');
    expect(row?.textContent).toContain('Bird');
    expect(row?.textContent).toContain('Salle 1');
    expect(row?.textContent?.replace(/\s+/g, ' ')).toContain('42 / 170');
  });

  it('when a screening is added, then the api receives the movie, the room, the day, the time and the price, and the day is read again', async () => {
    const { element, service, fill } = await render();
    const form = element.querySelector<HTMLFormElement>('form[name="new-screening"]')!;

    await fill(form, 'movieId', 'id-movie-metropolis');
    await fill(form, 'roomId', 'id-salle-2');
    await fill(form, 'time', '14:00');
    await fill(form, 'price', '8');
    form.dispatchEvent(new Event('submit'));

    expect(service.createScreening).toHaveBeenCalledWith({
      movieId: 'id-movie-metropolis',
      roomId: 'id-salle-2',
      startsAt: '2032-03-15T14:00:00',
      price: 8,
    });
    expect(service.getProgramming).toHaveBeenLastCalledWith('2032-03-15');
  });

  it('when the room is not available, then the french message is shown under the form', async () => {
    const { element, fill, fixture } = await render({
      createScreening: () => conflict('/errors/room-not-available'),
    });
    const form = element.querySelector<HTMLFormElement>('form[name="new-screening"]')!;

    await fill(form, 'movieId', 'id-movie-bird');
    await fill(form, 'roomId', 'id-salle-1');
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(element.querySelector('aside [role="alert"]')?.textContent).toContain(
      'La salle est déjà occupée à cette heure',
    );
  });

  it('when a screening is moved, then the api receives its new time and price', async () => {
    const { element, service, fill, click } = await render();

    await click('Modifier');
    const form = element.querySelector<HTMLFormElement>('form[name="edit-screening"]')!;
    await fill(form, 'time', '21:15');
    await fill(form, 'price', '11');
    form.dispatchEvent(new Event('submit'));

    expect(service.updateScreening).toHaveBeenCalledWith(
      'id-bird',
      { startsAt: '2032-03-15T21:15:00', price: 11 },
      false,
    );
  });

  it('when seats are taken, then the manager is warned under the screening and the change is sent again once confirmed', async () => {
    const { element, service, click } = await render({
      programming: day('2032-03-15', 3),
      cancelScreening: (_id, confirmed) =>
        confirmed ? of(undefined) : conflict('/errors/screening-has-reservations'),
    });

    await click('Annuler la séance');

    // Criterion 3: nothing is cancelled yet, the number of seats is shown
    expect(service.cancelScreening).toHaveBeenCalledTimes(1);
    expect(
      element
        .querySelector('[data-screening="id-bird"] [role="alertdialog"]')
        ?.textContent?.replace(/\s+/g, ' '),
    ).toContain('3 place(s) bloquée(s) ou vendue(s)');

    await click('Confirmer');

    expect(service.cancelScreening).toHaveBeenLastCalledWith('id-bird', true);
    expect(element.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('when a change is refused, then the french message is shown under the screening', async () => {
    const { element, click } = await render({
      cancelScreening: () => conflict('/errors/screening-started'),
    });

    await click('Annuler la séance');

    expect(
      element.querySelector('[data-screening="id-bird"] [role="alert"]')?.textContent,
    ).toContain('Cette séance a déjà commencé.');
    expect(element.querySelector('aside [role="alert"]')).toBeNull();
  });

  it('when a screening is over, then it is shown as ended and can be neither modified nor cancelled', async () => {
    const { element } = await render({ programming: day('2020-03-15') });

    const row = element.querySelector('[data-screening="id-bird"]');
    expect(row?.textContent).toContain('Terminée');
    expect(row?.querySelector('button')).toBeNull();
  });

  it('when the movie of a screening is playing, then it is shown as started and can be neither modified nor cancelled', async () => {
    // 21:00 on the day: Bird (161 minutes) started at 20:30 and ends at 23:11
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2032, 2, 15, 21, 0, 0));
    const { element } = await render({ programming: day('2032-03-15') });

    const row = element.querySelector('[data-screening="id-bird"]');
    expect(row?.textContent).toContain('Commencée');
    expect(row?.querySelector('button')).toBeNull();
  });

  describe('US 5.6 – a new movie', () => {
    async function openMovieForm(options: Parameters<typeof render>[0] = {}) {
      const page = await render(options);
      await page.click('Ajouter un film au catalogue');
      const form = page.element.querySelector<HTMLFormElement>('form[name="new-movie"]')!;
      const fillMovie = async () => {
        await page.fill(form, 'title', '  Autour de minuit ');
        await page.fill(form, 'synopsis', 'Paris, 1959.');
        await page.fill(form, 'durationMinutes', '133');
        await page.fill(form, 'releaseDate', '1986-10-03');
        await page.fill(form, 'genre', 'Drame');
        await page.choose(form, minuit);
      };
      return { ...page, form, fillMovie };
    }

    it('when a movie is added, then the api receives its card and its poster, and the new movie is chosen for the next screening', async () => {
      const { element, service, form, fillMovie, fixture } = await openMovieForm();
      await fillMovie();
      // The day read again holds the new movie
      const withNewMovie = day('2032-03-15');
      withNewMovie.movies.push({
        movieId: 'id-movie-new',
        title: 'Autour de minuit',
        durationMinutes: 133,
        synopsis: 'Paris, 1959.',
        genre: 'Drame',
        releaseDate: '1986-10-03',
        posterUrl: '/posters/minuit.png',
      });
      service.getProgramming.mockReturnValue(of(withNewMovie));

      form.dispatchEvent(new Event('submit'));
      await fixture.whenStable();

      expect(service.createMovie).toHaveBeenCalledWith({
        title: 'Autour de minuit',
        synopsis: 'Paris, 1959.',
        durationMinutes: 133,
        genre: 'Drame',
        releaseDate: '1986-10-03',
        poster: minuit,
      });
      expect(service.getProgramming).toHaveBeenLastCalledWith('2032-03-15');
      // Criterion 1: offered, and already chosen, in the form of a new screening
      expect(
        element.querySelector<HTMLSelectElement>('form[name="new-screening"] [name="movieId"]')
          ?.value,
      ).toBe('id-movie-new');
      expect(element.querySelector('[role="status"]')?.textContent).toContain('Autour de minuit');
      expect(element.querySelector('form[name="new-movie"]')).toBeNull();
    });

    it('when the genre is chosen, then only the genres sent by the api are offered', async () => {
      const { form } = await openMovieForm();

      const genres = Array.from(form.querySelectorAll('[name="genre"] option')).map((option) =>
        option.textContent?.trim(),
      );

      expect(genres).toEqual(['Choisir un genre', 'Biopic', 'Drame', 'Science-fiction']);
    });

    it('when the poster weighs more than 2 MB, then it is refused before anything is sent', async () => {
      const { service, form, fill, choose } = await openMovieForm();
      await fill(form, 'title', 'Autour de minuit');

      await choose(
        form,
        new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'lourde.jpg', { type: 'image/jpeg' }),
      );

      expect(form.querySelector('[role="alert"]')?.textContent).toContain('2 Mo');
      expect(form.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
      expect(service.createMovie).not.toHaveBeenCalled();
    });

    it('when the movie is already in the catalog, then the french message is shown in its form', async () => {
      const { element, form, fillMovie, fixture } = await openMovieForm({
        createMovie: () => conflict('/errors/movie-already-exists'),
      });
      await fillMovie();

      form.dispatchEvent(new Event('submit'));
      await fixture.whenStable();

      expect(form.querySelector('[role="alert"]')?.textContent).toContain('déjà au catalogue');
      expect(element.querySelector('[role="status"]')).toBeNull();
    });
  });

  describe('US 5.6 – edit and archive a movie', () => {
    async function openBird(options: Parameters<typeof render>[0] = {}) {
      const page = await render(options);
      await page.fill(page.element.querySelector('aside')!, 'movieToEdit', 'id-movie-bird');
      const form = page.element.querySelector<HTMLFormElement>('form[name="edit-movie"]')!;
      return { ...page, form };
    }

    it('when a movie of the catalog is chosen, then its form is filled with its card', async () => {
      const { form } = await openBird();
      const value = (name: string) =>
        form.querySelector<HTMLInputElement>(`[name="${name}"]`)?.value;

      expect(form.querySelector('h2')?.textContent).toContain('Bird');
      expect(value('title')).toBe('Bird');
      expect(value('synopsis')).toBe('Charlie Parker');
      expect(value('durationMinutes')).toBe('161');
      expect(value('releaseDate')).toBe('1988-09-30');
      expect(value('genre')).toBe('Biopic');
      // The current poster: a file field cannot be filled in
      expect(form.querySelector('img')?.getAttribute('src')).toBe('/posters/bird.png');
    });

    it('when the card is saved, then the api receives the movie and its fields without a poster, and the day is read again', async () => {
      const { element, service, form, fill, fixture } = await openBird();
      await fill(form, 'title', ' Bird, version restaurée ');
      await fill(form, 'genre', 'Drame');

      form.dispatchEvent(new Event('submit'));
      await fixture.whenStable();

      expect(service.updateMovie).toHaveBeenCalledWith('id-movie-bird', {
        title: 'Bird, version restaurée',
        synopsis: 'Charlie Parker',
        durationMinutes: 161,
        genre: 'Drame',
        releaseDate: '1988-09-30',
        poster: null,
      });
      expect(service.getProgramming).toHaveBeenLastCalledWith('2032-03-15');
      expect(element.querySelector('[role="status"]')?.textContent).toContain(
        'Bird, version restaurée',
      );
      expect(element.querySelector('form[name="edit-movie"]')).toBeNull();
    });

    it('when a movie is archived after confirmation, then the api archives it and a message says so', async () => {
      const { element, service, click } = await openBird();

      await click('Archiver ce film');

      // Criterion 6: nothing is sent before the confirmation
      expect(service.archiveMovie).not.toHaveBeenCalled();
      expect(
        element
          .querySelector('form[name="edit-movie"] [role="alertdialog"]')
          ?.textContent?.replace(/\s+/g, ' '),
      ).toContain('plus proposé à la programmation');

      await click("Confirmer l'archivage");

      expect(service.archiveMovie).toHaveBeenCalledWith('id-movie-bird');
      expect(element.querySelector('[role="status"]')?.textContent).toContain(
        '« Bird » est archivé',
      );
      expect(service.getProgramming).toHaveBeenLastCalledWith('2032-03-15');
    });

    it('when a screening of the movie has not ended, then the french message is shown in its form', async () => {
      const { form, click } = await openBird({
        archiveMovie: () => conflict('/errors/movie-has-screenings'),
      });

      await click('Archiver ce film');
      await click("Confirmer l'archivage");

      expect(form.querySelector('[role="alert"]')?.textContent).toContain("n'est pas terminée");
    });
  });
});
