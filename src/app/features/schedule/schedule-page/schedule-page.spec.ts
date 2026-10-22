import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { MovieSchedule, Schedule } from '../models/schedule';
import { ScheduleService } from '../schedule.service';
import { SchedulePage } from './schedule-page';

function movie(title: string, genre: string, startsAt: string[]): MovieSchedule {
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
    })),
  };
}

describe('US 1.1 – SchedulePage', () => {
  async function render(getSchedule: (date?: string) => Observable<Schedule>) {
    const service = { getSchedule: vi.fn(getSchedule) };
    TestBed.configureTestingModule({
      imports: [SchedulePage],
      providers: [provideRouter([]), { provide: ScheduleService, useValue: service }],
    });
    const fixture = TestBed.createComponent(SchedulePage);
    await fixture.whenStable();
    return { element: fixture.nativeElement as HTMLElement, fixture, service };
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

    const genre = element.querySelector<HTMLSelectElement>('select')!;
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
});
