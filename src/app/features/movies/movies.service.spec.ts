import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Movie } from './models/movie';
import { MovieDetails } from './models/movie-details';
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

  it('when a movie is requested, then GET /api/movies/{id} is called', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    const movieId = '22222222-2222-2222-2222-000000000005';
    const expected: MovieDetails = {
      movieId,
      title: 'Bird',
      synopsis: '',
      durationMinutes: 161,
      genre: 'Drame',
      releaseDate: '1988-09-30',
      posterUrl: 'https://posters.test/bird.jpg',
      days: [],
    };
    let result: MovieDetails | undefined;

    TestBed.inject(MoviesService)
      .getMovieDetails(movieId)
      .subscribe((movie) => (result = movie));

    const request = http.expectOne(`/api/movies/${movieId}`);
    expect(request.request.method).toBe('GET');
    request.flush(expected);
    expect(result).toEqual(expected);
    http.verify();
  });
});
