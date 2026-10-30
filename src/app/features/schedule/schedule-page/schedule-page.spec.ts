import { ViewportScroller } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { MovieSchedule, Schedule } from '../models/schedule';
import { ScheduleService } from '../schedule.service';
import { SchedulePage } from './schedule-page';

function movie(
  title: string,
  genre: string,
  startsAt: string[],
  remainingSeats: number[] = [],
): MovieSchedule {
  return {
    movieId: `id-${title}`,
    title,
    synopsis: '',
    durationMinutes: 120,
    genre,
    releaseDate: '2020-01-01',
    posterUrl: `https://posters.test/${title}.jpg`,
    screenings: startsAt.map((time, index) => ({
      screeningId: `${title}-${index}`,
      roomName: `Salle ${index + 1}`,
      startsAt: `2026-07-18T${time}:00`,
      price: 9.5,
      remainingSeats: remainingSeats[index] ?? 100,
    })),
  };
}

describe('US 1.1 – SchedulePage', () => {
  async function render(
    getSchedule: (date?: string) => Observable<Schedule>,
    fragment: string | null = null,
  ) {
    const service = { getSchedule: vi.fn(getSchedule) };
    const scroller = { scrollToAnchor: vi.fn() };
    TestBed.configureTestingModule({
      imports: [SchedulePage],
      providers: [
        provideRouter([]),
        { provide: ScheduleService, useValue: service },
        { provide: ViewportScroller, useValue: scroller },
        { provide: ActivatedRoute, useValue: { fragment: of(fragment) } },
      ],
    });
    const fixture = TestBed.createComponent(SchedulePage);
    await fixture.whenStable();
    return { element: fixture.nativeElement as HTMLElement, fixture, service, scroller };
  }

  const today: Schedule = {
    date: '2026-07-18',
    movies: [
      movie('Blue Note', 'Documentaire', ['14:30', '20:45']),
      movie('Metropolis', 'Science-fiction', ['18:00']),
    ],
  };

  it('when the page opens, then the schedule is requested without a date', async () => {
    const { service } = await render(() => of(today));

    expect(service.getSchedule).toHaveBeenCalledWith(undefined);
  });

  it('when the schedule has movies, then each movie is shown with its screenings', async () => {
    const { element } = await render(() => of(today));

    const cards = element.querySelectorAll('article');
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('Blue Note');
    expect(cards[0].textContent).toContain('14:30');
    expect(cards[0].textContent).toContain('Salle 1');
    expect(cards[0].textContent).toContain('20:45');
    expect(cards[0].textContent).toContain('Salle 2');
    expect(cards[1].textContent).toContain('Metropolis');
  });

  it('when the schedule is empty, then the "no screening" message is shown', async () => {
    const { element } = await render(() => of({ date: '2026-07-18', movies: [] }));

    expect(element.textContent).toContain("Aucune séance n'est programmée ce jour-là.");
  });

  it('when the schedule is loaded, then the day and the six following days can be chosen', async () => {
    const { element } = await render(() => of(today));

    const days = element.querySelectorAll<HTMLButtonElement>('[data-day]');
    expect(Array.from(days, (day) => day.dataset['day'])).toEqual([
      '2026-07-18',
      '2026-07-19',
      '2026-07-20',
      '2026-07-21',
      '2026-07-22',
      '2026-07-23',
      '2026-07-24',
    ]);
    expect(days[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('when a date is chosen, then the schedule of that date is loaded', async () => {
    const nextDay: Schedule = {
      date: '2026-07-19',
      movies: [movie('Vertigo', 'Thriller', ['21:00'])],
    };
    const { element, fixture, service } = await render((date) =>
      of(date === '2026-07-19' ? nextDay : today),
    );

    element.querySelector<HTMLButtonElement>('[data-day="2026-07-19"]')?.click();
    await fixture.whenStable();

    expect(service.getSchedule).toHaveBeenLastCalledWith('2026-07-19');
    expect(element.querySelectorAll('article').length).toBe(1);
    expect(element.textContent).toContain('Vertigo');
    expect(element.querySelector('[data-day="2026-07-19"]')?.getAttribute('aria-pressed')).toBe(
      'true',
    );
  });

  it('when a genre is chosen, then only the movies of that genre are shown', async () => {
    const { element, fixture } = await render(() => of(today));

    const genre = element.querySelector<HTMLSelectElement>('select[name="genre"]')!;
    genre.value = 'Science-fiction';
    genre.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    const cards = element.querySelectorAll('article');
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain('Metropolis');
  });

  it('when the api fails, then an error message is shown', async () => {
    const { element } = await render(() => throwError(() => new Error('Network error')));

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'La programmation est momentanément indisponible.',
    );
  });

  it('when the schedule of today is loaded, then its first four movies are featured', async () => {
    const titles = ['Alien', 'Blue Note', 'Casablanca', 'Drive', 'Elephant'];
    const { element } = await render(() =>
      of({ date: '2026-07-18', movies: titles.map((title) => movie(title, 'Drame', ['20:00'])) }),
    );

    const featured = element.querySelector('app-featured-movies');
    expect(featured?.querySelector('h2')?.textContent?.trim()).toBe('Alien');
    expect(featured?.textContent).toContain('04');
  });

  it('when a film is searched, then the page scrolls to its screenings', async () => {
    const { element, fixture, scroller } = await render(() => of(today));

    const film = element.querySelector<HTMLSelectElement>('select[name="movie"]')!;
    film.value = 'id-Metropolis';
    film.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    element.querySelector<HTMLButtonElement>('app-quick-booking button')?.click();
    await fixture.whenStable();

    expect(element.querySelector('#movie-id-Metropolis')).not.toBeNull();
    expect(scroller.scrollToAnchor).toHaveBeenCalledWith('movie-id-Metropolis');
  });

  it('when no film is searched, then the page scrolls to the schedule of the day', async () => {
    const { element, fixture, scroller } = await render(() => of(today));

    element.querySelector<HTMLButtonElement>('app-quick-booking button')?.click();
    await fixture.whenStable();

    expect(element.querySelector('#schedule')).not.toBeNull();
    expect(scroller.scrollToAnchor).toHaveBeenCalledWith('schedule');
  });

  describe('pagination', () => {
    const titles = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'B1', 'B2'];
    const busyDay: Schedule = {
      date: '2026-07-18',
      movies: titles.map((title) => movie(title, 'Drame', ['20:00'])),
    };
    const shownTitles = (element: HTMLElement) =>
      Array.from(element.querySelectorAll('#schedule article h3'), (title) =>
        title.textContent?.trim(),
      );

    it('when the day has more than six movies, then they are shown six at a time', async () => {
      const { element } = await render(() => of(busyDay));

      expect(shownTitles(element)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6']);
      expect(element.querySelector('#schedule app-paginator nav')).not.toBeNull();
    });

    it('when the next page is chosen, then its movies are shown and the page scrolls back to the schedule', async () => {
      const { element, fixture, scroller } = await render(() => of(busyDay));

      element
        .querySelector<HTMLButtonElement>('#schedule button[aria-label="Page suivante"]')
        ?.click();
      await fixture.whenStable();

      expect(shownTitles(element)).toEqual(['B1', 'B2']);
      expect(scroller.scrollToAnchor).toHaveBeenCalledWith('schedule');
    });

    it('when a film of another page is searched, then its page is shown and the page scrolls to it', async () => {
      const { element, fixture, scroller } = await render(() => of(busyDay));

      const film = element.querySelector<HTMLSelectElement>('select[name="movie"]')!;
      film.value = 'id-B2';
      film.dispatchEvent(new Event('change'));
      await fixture.whenStable();
      element.querySelector<HTMLButtonElement>('app-quick-booking button')?.click();
      await fixture.whenStable();

      expect(shownTitles(element)).toEqual(['B1', 'B2']);
      expect(scroller.scrollToAnchor).toHaveBeenCalledWith('movie-id-B2');
    });

    it('when another day is chosen, then its first page is shown', async () => {
      const { element, fixture } = await render(() => of(busyDay));
      element
        .querySelector<HTMLButtonElement>('#schedule button[aria-label="Page suivante"]')
        ?.click();
      await fixture.whenStable();

      element.querySelector<HTMLButtonElement>('[data-day="2026-07-19"]')?.click();
      await fixture.whenStable();

      expect(shownTitles(element)[0]).toBe('A1');
    });
  });

  it('when the page is opened on a section, then it scrolls to that section once the schedule is shown', async () => {
    const { element, scroller } = await render(() => of(today), 'cinema');

    expect(element.querySelector('#cinema')).not.toBeNull();
    expect(element.querySelector('#featured')).not.toBeNull();
    expect(scroller.scrollToAnchor).toHaveBeenCalledWith('cinema');
  });

  describe('another date, up to a year ahead', () => {
    it('when the schedule is loaded, then another date can be chosen from today to a year later', async () => {
      const { element } = await render(() => of(today));

      const otherDay = element.querySelector<HTMLInputElement>('input[name="otherDay"]');
      expect(otherDay?.type).toBe('date');
      expect(otherDay?.getAttribute('min')).toBe('2026-07-18');
      expect(otherDay?.getAttribute('max')).toBe('2027-07-18');
    });

    it('when another date is chosen, then the schedule of that date is loaded', async () => {
      const farAhead: Schedule = {
        date: '2027-07-17',
        movies: [movie('Bird', 'Drame', ['20:30'])],
      };
      const { element, fixture, service } = await render((date) =>
        of(date === '2027-07-17' ? farAhead : today),
      );

      const otherDay = element.querySelector<HTMLInputElement>('input[name="otherDay"]');
      expect(otherDay).not.toBeNull();
      otherDay!.value = '2027-07-17';
      otherDay!.dispatchEvent(new Event('change'));
      await fixture.whenStable();

      expect(service.getSchedule).toHaveBeenLastCalledWith('2027-07-17');
      expect(element.textContent).toContain('Bird');
    });
  });

  describe('US 2.2 – remaining seats', () => {
    it('when a screening has seats left, then their number is shown', async () => {
      const { element } = await render(() =>
        of({
          date: '2026-07-18',
          movies: [movie('Blue Note', 'Documentaire', ['14:30', '20:45'], [42, 1])],
        }),
      );

      const screenings = element.querySelectorAll('article li');
      expect(screenings[0].textContent).toContain('42 places');
      expect(screenings[1].textContent).toContain('1 place');
      expect(screenings[1].textContent).not.toContain('1 places');
    });

    it('when a screening has no seat left, then it is shown as full', async () => {
      const { element } = await render(() =>
        of({ date: '2026-07-18', movies: [movie('Blue Note', 'Documentaire', ['20:45'], [0])] }),
      );

      const screening = element.querySelector('article li');
      expect(screening?.textContent).toContain('Complet');
      expect(screening?.textContent).not.toContain('0 place');
    });
  });
});
