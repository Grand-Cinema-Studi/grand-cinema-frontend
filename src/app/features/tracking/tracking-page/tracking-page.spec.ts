import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';
import { ReservationTracking } from '../models/reservation-tracking';
import { TrackingService } from '../tracking.service';
import { TrackingPage } from './tracking-page';

// Bird: 120 sold of 170 (71 %); Metropolis: 30 sold of 300 (10 %)
function day(date: string): ReservationTracking {
  return {
    date,
    screenings: [
      {
        screeningId: 'id-bird',
        startsAt: `${date}T20:30:00`,
        movieTitle: 'Bird',
        roomName: 'Salle 1',
        capacity: 170,
        soldOnline: 100,
        soldAtCounter: 20,
        heldSeats: 4,
        remainingSeats: 46,
      },
      {
        screeningId: 'id-metropolis',
        startsAt: `${date}T22:00:00`,
        movieTitle: 'Metropolis',
        roomName: 'Salle 2',
        capacity: 300,
        soldOnline: 30,
        soldAtCounter: 0,
        heldSeats: 0,
        remainingSeats: 270,
      },
    ],
  };
}

describe('US 5.3 – TrackingPage', () => {
  async function render(getTracking: (date?: string) => Observable<ReservationTracking>) {
    const service = { getTracking: vi.fn(getTracking) };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: TrackingService, useValue: service }],
    });
    const fixture = TestBed.createComponent(TrackingPage);
    await fixture.whenStable();
    return { element: fixture.nativeElement as HTMLElement, fixture, service };
  }

  const text = (element: Element | null) => element?.textContent?.replace(/\s+/g, ' ') ?? '';

  it('when the page opens, then each screening shows its seats sold, held and left, its capacity and its fill rate, and the day its total', async () => {
    const { element, service } = await render(() => of(day('2032-03-15')));

    expect(service.getTracking).toHaveBeenCalledWith(undefined);
    const bird = text(element.querySelector('[data-screening="id-bird"]'));
    expect(bird).toContain('20:30');
    expect(bird).toContain('Bird');
    expect(bird).toContain('Salle 1');
    expect(bird).toContain('120 vendues');
    expect(bird).toContain('100 en ligne');
    expect(bird).toContain('20 au guichet');
    expect(bird).toContain('4 bloquées');
    expect(bird).toContain('46 restantes');
    expect(bird).toContain('170 places');
    expect(bird).toContain('71 %');
    // The day: 150 sold of 470 (32 %)
    expect(text(element.querySelector('[data-total]'))).toContain('150 / 470');
    expect(text(element.querySelector('[data-total]'))).toContain('32 %');
  });

  it('when another day is chosen, then the tracking of that day is loaded', async () => {
    const { element, fixture, service } = await render((date) => of(day(date ?? '2032-03-15')));

    const input = element.querySelector<HTMLInputElement>('input[name="day"]')!;
    input.value = '2032-03-16';
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(service.getTracking).toHaveBeenLastCalledWith('2032-03-16');
    expect(text(element.querySelector('[data-screening="id-bird"]'))).toContain('20:30');
  });
});
