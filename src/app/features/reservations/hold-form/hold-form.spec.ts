import { HttpErrorResponse } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { Screening } from '../../schedule/models/schedule';
import { Reservation } from '../models/reservation';
import { ReservationsService } from '../reservations.service';
import { HoldForm } from './hold-form';

@Component({
  imports: [HoldForm],
  template: `<app-hold-form [screening]="screening()" />`,
})
class Host {
  readonly screening = signal<Screening>({
    screeningId: 'id-screening',
    roomName: 'Salle 2',
    startsAt: '2027-10-30T20:30:00',
    price: 12,
    remainingSeats: 42,
  });
}

const hold: Reservation = {
  reservationId: 'id-hold',
  screeningId: 'id-screening',
  status: 'PendingPayment',
  seats: ['A1', 'A2'],
  totalAmount: 24,
  expiresAt: '2027-10-30T17:07:59Z',
};

describe('US 2.3 – HoldForm', () => {
  async function render(
    options: {
      signedIn?: boolean;
      remainingSeats?: number;
      holdSeats?: () => Observable<Reservation>;
    } = {},
  ) {
    const reservations = { holdSeats: vi.fn(options.holdSeats ?? (() => of(hold))) };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isSignedIn: signal(options.signedIn ?? true) } },
        { provide: ReservationsService, useValue: reservations },
      ],
    });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Host);
    const remainingSeats = options.remainingSeats;
    if (remainingSeats !== undefined) {
      fixture.componentInstance.screening.update((screening) => ({ ...screening, remainingSeats }));
    }
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    const seatCounts = () =>
      Array.from(element.querySelectorAll('select[name="seatCount"] option'), (option) =>
        option.textContent?.trim(),
      );
    const book = async (seatCount: number) => {
      const select = element.querySelector<HTMLSelectElement>('select[name="seatCount"]');
      if (select) {
        select.value = String(seatCount);
        select.dispatchEvent(new Event('change'));
      }
      element.querySelector('form')?.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    };

    return { element, reservations, navigate, navigateByUrl, seatCounts, book };
  }

  it('when many seats are left, then 1 to 10 seats can be chosen', async () => {
    const { seatCounts } = await render({ remainingSeats: 42 });

    expect(seatCounts()).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
  });

  it('when fewer than 10 seats are left, then no more than the seats left can be chosen', async () => {
    const { seatCounts } = await render({ remainingSeats: 3 });

    expect(seatCounts()).toEqual(['1', '2', '3']);
  });

  it('when the visitor is not signed in, then the sign-in page opens and nothing is held', async () => {
    const page = await render({ signedIn: false });

    await page.book(2);

    expect(page.reservations.holdSeats).not.toHaveBeenCalled();
    // In the test, the router is at "/": in the site, it is the address of the form
    expect(page.navigate).toHaveBeenCalledWith(['/sign-in'], { queryParams: { returnUrl: '/' } });
  });

  it('when the customer books seats, then they are held and the page of the hold opens', async () => {
    const page = await render();

    await page.book(2);

    expect(page.reservations.holdSeats).toHaveBeenCalledWith({
      screeningId: 'id-screening',
      seatCount: 2,
    });
    expect(page.navigateByUrl).toHaveBeenCalledWith('/reservations/id-hold');
  });

  it('when not enough seats are left, then an explicit message is shown', async () => {
    const page = await render({
      holdSeats: () =>
        throwError(
          () => new HttpErrorResponse({ status: 409, error: { type: '/errors/not-enough-seats' } }),
        ),
    });

    await page.book(2);

    expect(page.element.querySelector('[role="alert"]')?.textContent).toContain(
      'Il ne reste plus assez de places pour cette séance.',
    );
    expect(page.navigateByUrl).not.toHaveBeenCalled();
  });
});
