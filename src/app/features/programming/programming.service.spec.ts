import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProgrammingService } from './programming.service';

describe('US 5.2 – ProgrammingService', () => {
  function setUp() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return {
      http: TestBed.inject(HttpTestingController),
      service: TestBed.inject(ProgrammingService),
    };
  }

  it('when a screening is created, then POST /api/programming/screenings is called with the movie, the room, the time and the price', () => {
    const { http, service } = setUp();
    const body = {
      movieId: 'id-bird',
      roomId: 'id-salle-1',
      startsAt: '2026-11-20T20:30:00',
      price: 9.5,
    };
    let created: { screeningId: string } | undefined;

    service.createScreening(body).subscribe((result) => (created = result));

    const request = http.expectOne('/api/programming/screenings');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush({ screeningId: 'id-new' });
    expect(created).toEqual({ screeningId: 'id-new' });
    http.verify();
  });

  it('when a change is confirmed, then it is sent again with confirmed=true', () => {
    const { http, service } = setUp();

    service
      .updateScreening('id-bird', { startsAt: '2026-11-20T21:00:00', price: 11 }, true)
      .subscribe();
    service.cancelScreening('id-bird', false).subscribe();

    const moved = http.expectOne('/api/programming/screenings/id-bird?confirmed=true');
    expect(moved.request.method).toBe('PUT');
    expect(moved.request.body).toEqual({ startsAt: '2026-11-20T21:00:00', price: 11 });
    moved.flush(null);
    const cancelled = http.expectOne(
      (request) =>
        request.method === 'DELETE' &&
        request.urlWithParams === '/api/programming/screenings/id-bird',
    );
    cancelled.flush(null);
    http.verify();
  });

  it('when a movie is added, then POST /api/programming/movies is called with a multipart form holding the poster', () => {
    const { http, service } = setUp();
    const poster = new File([new Uint8Array(10)], 'minuit.png', { type: 'image/png' });
    let created: { movieId: string } | undefined;

    service
      .createMovie({
        title: 'Autour de minuit',
        synopsis: 'Paris, 1959.',
        durationMinutes: 133,
        genre: 'Drame',
        releaseDate: '1986-10-03',
        poster,
      })
      .subscribe((result) => (created = result));

    const request = http.expectOne('/api/programming/movies');
    expect(request.request.method).toBe('POST');
    // A form, not JSON: the browser writes the content type and its boundary itself
    const form = request.request.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect(form.get('title')).toBe('Autour de minuit');
    expect(form.get('synopsis')).toBe('Paris, 1959.');
    expect(form.get('durationMinutes')).toBe('133');
    expect(form.get('genre')).toBe('Drame');
    expect(form.get('releaseDate')).toBe('1986-10-03');
    expect((form.get('poster') as File).name).toBe('minuit.png');
    request.flush({ movieId: 'id-new' });
    expect(created).toEqual({ movieId: 'id-new' });
    http.verify();
  });

  it('when a movie is edited without a new poster, then PUT /api/programming/movies/{id} is called with a form without the poster', () => {
    const { http, service } = setUp();

    service
      .updateMovie('id-bird', {
        title: 'Bird',
        synopsis: 'Charlie Parker.',
        durationMinutes: 161,
        genre: 'Biopic',
        releaseDate: '1988-09-30',
        poster: null,
      })
      .subscribe();

    const request = http.expectOne('/api/programming/movies/id-bird');
    expect(request.request.method).toBe('PUT');
    const form = request.request.body as FormData;
    expect(form.get('title')).toBe('Bird');
    expect(form.get('durationMinutes')).toBe('161');
    expect(form.get('genre')).toBe('Biopic');
    // No file: the API keeps the poster
    expect(form.has('poster')).toBe(false);
    request.flush(null);
    http.verify();
  });

  it('when a movie is archived, then POST /api/programming/movies/{id}/archive is called', () => {
    const { http, service } = setUp();

    service.archiveMovie('id-bird').subscribe();

    const request = http.expectOne('/api/programming/movies/id-bird/archive');
    expect(request.request.method).toBe('POST');
    request.flush(null);
    http.verify();
  });
});
