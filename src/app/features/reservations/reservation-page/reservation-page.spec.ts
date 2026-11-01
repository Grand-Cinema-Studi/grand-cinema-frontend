import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Reservation } from '../models/reservation';
import { ReservationsService } from '../reservations.service';
import { ReservationPage } from './reservation-page';

describe('US 2.3 – ReservationPage', () => {
  const hold: Reservation = {
    reservationId: 'id-hold',
    screeningId: 'id-screening',
    movieId: 'id-bird',
    status: 'PendingPayment',
    seats: ['A1', 'A2'],
    totalAmount: 24,
    expiresAt: '2026-10-30T17:07:59Z',
  };

  beforeEach(() => {
    // Only the clock of the countdown is simulated: Angular keeps its own timers
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(new Date('2026-10-30T17:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function render(reservation: Reservation) {
    const reservations = {
      getReservation: vi.fn(() => of(reservation)),
      cancelHold: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      imports: [ReservationPage],
      providers: [provideRouter([]), { provide: ReservationsService, useValue: reservations }],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ReservationPage);
    fixture.componentRef.setInput('reservationId', 'id-hold');
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement, reservations, navigate };
  }

  it('when the seats are held, then they are shown with the amount and the time left to pay', async () => {
    const { element } = await render(hold);

    expect(element.textContent).toContain('A1, A2');
    expect(element.querySelector('[data-countdown]')?.textContent?.trim()).toBe('07:59');
    expect(element.querySelector('[role="alert"]')).toBeNull();
  });

  it('when the 10 minutes run out on the page, then the visitor is told that the seats were freed', async () => {
    const { element, fixture } = await render(hold);

    vi.advanceTimersByTime(8 * 60 * 1000);
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'vos places ont été libérées',
    );
    expect(element.querySelector('[data-countdown]')).toBeNull();
  });

  it('when the api says that the hold has expired, then the visitor is told that the seats were freed', async () => {
    const { element } = await render({ ...hold, status: 'Expired' });

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'vos places ont été libérées',
    );
  });

  it('when the customer cancels the hold, then it is cancelled and the page of the movie opens', async () => {
    const { element, fixture, reservations, navigate } = await render(hold);

    Array.from(element.querySelectorAll('button'))
      .find((button) => button.textContent?.trim() === 'Annuler')
      ?.click();
    await fixture.whenStable();

    expect(reservations.cancelHold).toHaveBeenCalledWith('id-hold');
    expect(navigate).toHaveBeenCalledWith('/movies/id-bird');
  });

  it('when the seats were freed, then the visitor can choose another screening of the same movie', async () => {
    const { element } = await render({ ...hold, status: 'Expired' });

    const link = Array.from(element.querySelectorAll('a')).find((anchor) =>
      anchor.textContent?.includes('Choisir une autre séance'),
    );
    expect(link?.getAttribute('href')).toBe('/movies/id-bird');
  });
});
