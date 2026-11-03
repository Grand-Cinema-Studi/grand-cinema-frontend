import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ExternalNavigation } from '../../../core/navigation/external-navigation';
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

  async function render(reservation: Reservation, payment?: string) {
    const reservations = {
      getReservation: vi.fn(() => of(reservation)),
      cancelHold: vi.fn(() => of(undefined)),
      startPayment: vi.fn(() => of({ checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test' })),
    };
    const externalNavigation = { go: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ReservationPage],
      providers: [
        provideRouter([]),
        { provide: ReservationsService, useValue: reservations },
        { provide: ExternalNavigation, useValue: externalNavigation },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ReservationPage);
    fixture.componentRef.setInput('reservationId', 'id-hold');
    if (payment) {
      fixture.componentRef.setInput('payment', payment);
    }
    await fixture.whenStable();
    return {
      fixture,
      element: fixture.nativeElement as HTMLElement,
      reservations,
      navigate,
      externalNavigation,
    };
  }

  function button(element: HTMLElement, label: string): HTMLButtonElement | undefined {
    return Array.from(element.querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === label,
    );
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

  it('when the terms of sale are not accepted, then the customer cannot pay', async () => {
    const { element } = await render(hold);

    expect(element.querySelector('a[href="/terms-of-sale"]')).not.toBeNull();
    expect(button(element, 'Payer')?.disabled).toBe(true);
  });

  it('when the customer accepts the terms of sale and pays, then the payment page of Stripe opens', async () => {
    const { element, fixture, reservations, externalNavigation } = await render(hold);

    element.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click();
    await fixture.whenStable();
    button(element, 'Payer')?.click();
    await fixture.whenStable();

    expect(reservations.startPayment).toHaveBeenCalledWith('id-hold');
    expect(externalNavigation.go).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/cs_test');
  });

  it('when the reservation is paid, then the payment is confirmed instead of the countdown', async () => {
    const { element } = await render({ ...hold, status: 'Confirmed' });

    expect(element.querySelector('h1')?.textContent).toContain('Paiement confirmé');
    expect(element.textContent).toContain('A1, A2');
    expect(element.querySelector('[data-countdown]')).toBeNull();
    expect(button(element, 'Annuler')).toBeUndefined();
  });

  it('when the customer comes back from Stripe before the confirmation, then the page waits for it', async () => {
    const { element, fixture, reservations } = await render(hold, 'success');

    // First reading: the notification of Stripe has not arrived yet
    vi.advanceTimersByTime(10);
    await fixture.whenStable();
    expect(element.querySelector('h1')?.textContent).toContain('Paiement en cours de confirmation');

    // 2 seconds later, the api has received it
    reservations.getReservation.mockReturnValue(of({ ...hold, status: 'Confirmed' }));
    vi.advanceTimersByTime(2000);
    await fixture.whenStable();
    expect(element.querySelector('h1')?.textContent).toContain('Paiement confirmé');
  });
});
