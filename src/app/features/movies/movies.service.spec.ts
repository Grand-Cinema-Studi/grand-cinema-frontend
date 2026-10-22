import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Movie } from './models/movie';
import { MoviesService } from './movies.service';

describe('US 1.1 – MoviesService', () => {
  it('when the movies showing are requested, then GET /api/movies is called', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    const expected: Movie[] = [];
    let result: Movie[] | undefined;

    TestBed.inject(MoviesService)
      .getMoviesShowing()
      .subscribe((movies) => (result = movies));

    const request = http.expectOne('/api/movies');
    expect(request.request.method).toBe('GET');
    request.flush(expected);
    expect(result).toEqual(expected);
    http.verify();
  });
});
