import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MovieSchedule } from '../models/schedule';
import { QuickBooking } from './quick-booking';

function movie(title: string): MovieSchedule {
  return {
    movieId: `id-${title}`,
    title,
    synopsis: '',
    durationMinutes: 100,
    genre: 'Drame',
    releaseDate: '2020-01-01',
    posterUrl: '',
    screenings: [],
  };
}

@Component({
  imports: [QuickBooking],
  template: `
    <app-quick-booking
      [days]="days"
      [selectedDay]="selectedDay()"
      [movies]="movies"
      (dayChange)="selectedDay.set($event)"
      (find)="found.set($event)"
    />
  `,
})
class Host {
  readonly days = ['2026-07-18', '2026-07-19', '2026-07-20'];
  readonly selectedDay = signal<string | null>('2026-07-18');
  readonly movies = [movie('Alien'), movie('Vertigo')];
  readonly found = signal<string | null | undefined>(undefined);
}

describe('US 1.1 – QuickBooking', () => {
  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const select = (name: string) =>
      element.querySelector<HTMLSelectElement>(`select[name="${name}"]`)!;
    const choose = async (name: string, value: string) => {
      select(name).value = value;
      select(name).dispatchEvent(new Event('change'));
      await fixture.whenStable();
    };
    const findScreening = async () => {
      element.querySelector<HTMLButtonElement>('button')?.click();
      await fixture.whenStable();
    };
    return { fixture, select, choose, findScreening };
  }

  it('when days and movies are given, then they are offered in the date and film fields', async () => {
    const { select } = await render();

    expect(Array.from(select('day').options, (option) => option.value)).toEqual([
      '2026-07-18',
      '2026-07-19',
      '2026-07-20',
    ]);
    expect(select('day').value).toBe('2026-07-18');
    expect(Array.from(select('movie').options, (option) => option.textContent?.trim())).toEqual([
      'Choisissez un film',
      'Alien',
      'Vertigo',
    ]);
  });

  it('when a date is chosen, then the day change is emitted', async () => {
    const { fixture, choose } = await render();

    await choose('day', '2026-07-19');

    expect(fixture.componentInstance.selectedDay()).toBe('2026-07-19');
  });

  it('when a film is chosen and "Trouver ma séance" is pressed, then that film is searched', async () => {
    const { fixture, choose, findScreening } = await render();

    await choose('movie', 'id-Vertigo');
    await findScreening();

    expect(fixture.componentInstance.found()).toBe('id-Vertigo');
  });

  it('when no film is chosen and "Trouver ma séance" is pressed, then the whole day is searched', async () => {
    const { fixture, findScreening } = await render();

    await findScreening();

    expect(fixture.componentInstance.found()).toBeNull();
  });
});
