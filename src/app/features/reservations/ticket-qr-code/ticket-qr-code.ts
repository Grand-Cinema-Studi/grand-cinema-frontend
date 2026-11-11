import { Component, computed, input } from '@angular/core';
import { create } from 'qrcode';

/** Quiet zone around the QR code, in modules: the readers need it. */
const MARGIN = 4;

/**
 * US 3.2: the QR code of a ticket, drawn in SVG from its code. One path, dark modules on white:
 * no image to store, sharp at any size, and nothing injected as HTML.
 */
@Component({
  selector: 'app-ticket-qr-code',
  templateUrl: './ticket-qr-code.html',
})
export class TicketQrCode {
  /** The ticket code, the only content of the QR code. */
  readonly code = input.required<string>();

  protected readonly qr = computed(() => {
    const modules = create(this.code(), { errorCorrectionLevel: 'M' }).modules;
    let path = '';
    for (let row = 0; row < modules.size; row++) {
      for (let column = 0; column < modules.size; column++) {
        if (modules.get(row, column)) {
          path += `M${column + MARGIN} ${row + MARGIN}h1v1h-1z`;
        }
      }
    }
    return { size: modules.size + 2 * MARGIN, path };
  });
}
