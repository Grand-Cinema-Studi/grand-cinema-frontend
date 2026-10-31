import { Component, input } from '@angular/core';

@Component({
  selector: 'app-reservation-page',
  template: '<section></section>',
})
export class ReservationPage {
  /** Identifier of the hold, read from the address /reservations/:reservationId. */
  readonly reservationId = input.required<string>();
}
