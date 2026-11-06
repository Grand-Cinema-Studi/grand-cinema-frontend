import { Component, input } from '@angular/core';

@Component({
  selector: 'app-ticket-qr-code',
  template: '',
})
export class TicketQrCode {
  /** The ticket code, the only content of the QR code. */
  readonly code = input.required<string>();
}
