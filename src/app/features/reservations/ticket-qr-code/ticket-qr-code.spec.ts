import { TestBed } from '@angular/core/testing';
import { TicketQrCode } from './ticket-qr-code';

describe('US 3.2 – TicketQrCode', () => {
  async function draw(code: string) {
    const fixture = TestBed.createComponent(TicketQrCode);
    fixture.componentRef.setInput('code', code);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('when a code is given, then a QR code is drawn with an accessible name, and another code draws another one', async () => {
    const first = await draw('0123456789abcdef0123456789abcdef');
    const second = await draw('fedcba9876543210fedcba9876543210');

    const svg = first.querySelector('svg');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toBe('QR code du billet');
    const drawing = first.querySelector('path')?.getAttribute('d');
    expect(drawing).toMatch(/^M\d+ \d+h1v1h-1z/);
    expect(second.querySelector('path')?.getAttribute('d')).not.toBe(drawing);
  });
});
