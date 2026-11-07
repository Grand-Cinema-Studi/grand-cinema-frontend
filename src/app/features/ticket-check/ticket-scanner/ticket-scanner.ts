import { Component, output } from '@angular/core';

@Component({
  selector: 'app-ticket-scanner',
  template: '',
})
export class TicketScanner {
  /** The text of each QR code read by the camera. */
  readonly scanned = output<string>();
}
