import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Schedule } from './models/schedule';
import { ScheduleService } from './schedule.service';

describe('US 1.1 – ScheduleService', () => {
  let service: ScheduleService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ScheduleService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('when no date is given, then GET /api/schedule is called without a date', () => {
    const expected: Schedule = { date: '2026-07-18', movies: [] };
    let result: Schedule | undefined;

    service.getSchedule().subscribe((schedule) => (result = schedule));

    const request = http.expectOne('/api/schedule');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.has('date')).toBe(false);
    request.flush(expected);
    expect(result).toEqual(expected);
  });

  it('when a date is given, then it is sent as the date parameter', () => {
    service.getSchedule('2026-07-19').subscribe();

    const request = http.expectOne((r) => r.url === '/api/schedule');
    expect(request.request.params.get('date')).toBe('2026-07-19');
    request.flush({ date: '2026-07-19', movies: [] });
  });
});
