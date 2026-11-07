import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { TicketCheck, TicketCheckScreening } from '../models/ticket-check';
import { TicketCheckService } from '../ticket-check.service';
import { TicketCheckPage } from './ticket-check-page';

const screenings: TicketCheckScreening[] = [
  {
    screeningId: 'id-bird',
    startsAt: '2026-11-12T20:30:00',
    movieTitle: 'Bird',
    roomName: 'Salle 1',
  },
  {
    screeningId: 'id-metropolis',
    startsAt: '2026-11-12T22:00:00',
    movieTitle: 'Metropolis',
    roomName: 'Salle 2',
  },
];
const code = '0123456789abcdef0123456789abcdef';

function refused(type: string, status = 409) {
  return throwError(() => new HttpErrorResponse({ status, error: { type } }));
}

describe('US 4.1 – TicketCheckPage', () => {
  async function render(checkTicket: () => Observable<TicketCheck>) {
    const service = { getScreenings: vi.fn(() => of(screenings)), checkTicket: vi.fn(checkTicket) };
    TestBed.configureTestingModule({
      imports: [TicketCheckPage],
      providers: [{ provide: TicketCheckService, useValue: service }],
    });
    const fixture = TestBed.createComponent(TicketCheckPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    // Types the code by hand, as when the QR code cannot be read
    async function check(text: string) {
      const input = element.querySelector<HTMLInputElement>('#ticket-code');
      input!.value = text;
      input!.dispatchEvent(new Event('input'));
      element.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    }
    return { element, service, check };
  }

  it('when a valid ticket is checked, then access is granted with the movie and the seats', async () => {
    const { element, service, check } = await render(() =>
      of({
        movieTitle: 'Bird',
        startsAt: '2026-11-12T20:30:00',
        roomName: 'Salle 1',
        seats: ['A1', 'A2'],
      }),
    );

    await check(code);

    expect(service.checkTicket).toHaveBeenCalledWith('id-bird', code);
    const verdict = element.querySelector('[data-verdict]');
    expect(verdict?.textContent).toContain('Accès autorisé');
    expect(verdict?.textContent).toContain('Bird');
    expect(verdict?.textContent).toContain('2 places : A1, A2');
  });

  it('when the ticket was already used, then access is refused with an explicit message', async () => {
    const { element, check } = await render(() => refused('/errors/ticket-already-used'));

    await check(code);

    const verdict = element.querySelector('[data-verdict]');
    expect(verdict?.textContent).toContain('Accès refusé');
    expect(verdict?.textContent).toContain('Billet déjà utilisé.');
  });

  it('when the ticket is for another screening or unknown, then access is refused with an explicit message', async () => {
    const answers = [
      refused('/errors/ticket-for-another-screening'),
      refused('/errors/ticket-not-found', 404),
    ];
    const { element, check } = await render(() => answers.shift()!);

    await check(code);
    expect(element.querySelector('[data-verdict]')?.textContent).toContain(
      'Ce billet est pour une autre séance.',
    );

    await check('bonjour');
    expect(element.querySelector('[data-verdict]')?.textContent).toContain(
      'QR code inconnu ou illisible.',
    );
  });
});
