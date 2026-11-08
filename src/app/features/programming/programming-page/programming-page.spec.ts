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
      { movieId: 'id-movie-bird', title: 'Bird', durationMinutes: 161 },
      { movieId: 'id-movie-metropolis', title: 'Metropolis', durationMinutes: 153 },
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

describe('US 5.2 – ProgrammingPage', () => {
  afterEach(() => vi.useRealTimers());

  async function render(
    options: {
      programming?: Programming;
      createScreening?: () => Observable<{ screeningId: string }>;
      updateScreening?: () => Observable<void>;
      cancelScreening?: (id: string, confirmed: boolean) => Observable<void>;
    } = {},
  ) {
    const service = {
      getProgramming: vi.fn(() => of(options.programming ?? day('2032-03-15'))),
      createScreening: vi.fn(options.createScreening ?? (() => of({ screeningId: 'id-new' }))),
      updateScreening: vi.fn(options.updateScreening ?? (() => of(undefined))),
      cancelScreening: vi.fn(options.cancelScreening ?? (() => of(undefined))),
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

    return { element, service, fill, click, fixture };
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
});
