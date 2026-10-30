import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Screening } from '../models/schedule';
import { ScreeningSlot } from './screening-slot';

@Component({
  imports: [ScreeningSlot],
  template: `<app-screening-slot [screening]="screening()" movieId="id-bird" />`,
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

describe('US 2.3 – ScreeningSlot', () => {
  async function render(remainingSeats: number) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.screening.update((screening) => ({ ...screening, remainingSeats }));
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('when the screening has seats left, then it opens the booking form on the page of its movie', async () => {
    const element = await render(42);

    expect(element.querySelector('a')?.getAttribute('href')).toBe(
      '/movies/id-bird?screening=id-screening',
    );
    expect(element.textContent).toContain('42 places');
  });

  it('when the screening is full, then it cannot be booked', async () => {
    const element = await render(0);

    expect(element.querySelector('a')).toBeNull();
    expect(element.textContent).toContain('Complet');
  });
});
