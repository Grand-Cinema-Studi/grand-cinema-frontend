import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { problemMessage } from '../../../core/errors/problem-message';
import { ProgrammedScreening, Programming, ProgrammingMovie } from '../models/programming';
import { ProgrammingService } from '../programming.service';

/** A change waiting for the confirmation of the manager, because seats are held or sold (criterion 3). */
interface PendingChange {
  screening: ProgrammedScreening;
  /** Sends the same change again, confirmed. */
  confirm: () => void;
}

/** Where a screening stands: still to come, started (its movie is playing), or ended. */
type ScreeningState = 'upcoming' | 'started' | 'ended';

/** A refused change of a screening, shown under it. */
interface RowError {
  screeningId: string;
  message: string;
}

/** As the API (PosterRules.MaxBytes): above, the poster is refused before being sent. */
const MAX_POSTER_BYTES = 2 * 1024 * 1024;

@Component({
  imports: [CurrencyPipe, DatePipe],
  selector: 'app-programming-page',
  templateUrl: './programming-page.html',
})
export class ProgrammingPage {
  private readonly programmingService = inject(ProgrammingService);

  protected readonly programming = signal<Programming | null>(null);
  protected readonly failed = signal(false);
  /** A refused new screening, shown under the form. */
  protected readonly addError = signal<string | null>(null);
  /** A refused change or cancellation, shown under its screening. */
  protected readonly rowError = signal<RowError | null>(null);
  protected readonly pending = signal<PendingChange | null>(null);

  // The form of a new screening, on the displayed day
  protected readonly movieId = signal('');
  protected readonly roomId = signal('');
  protected readonly time = signal('20:30');
  protected readonly price = signal(9.5);

  // The screening being moved, and its new day, time and price
  protected readonly editedId = signal<string | null>(null);
  protected readonly editedDay = signal('');
  protected readonly editedTime = signal('');
  protected readonly editedPrice = signal(0);

  // US 5.6: the form of a new movie, folded until the manager opens it
  protected readonly movieFormOpen = signal(false);
  protected readonly title = signal('');
  protected readonly synopsis = signal('');
  protected readonly durationMinutes = signal(0);
  protected readonly releaseDate = signal('');
  protected readonly genre = signal('');
  protected readonly poster = signal<File | null>(null);
  protected readonly movieError = signal<string | null>(null);
  /** The movie being edited; null for a new movie. */
  protected readonly editedMovie = signal<ProgrammingMovie | null>(null);
  /** The archiving waits for a confirmation, in the form. */
  protected readonly confirmingArchive = signal(false);
  /** What happened to the last movie added, saved or archived. */
  protected readonly movieMessage = signal<string | null>(null);
  protected readonly movieReady = computed(
    () =>
      this.title().trim() !== '' &&
      this.synopsis().trim() !== '' &&
      this.durationMinutes() > 0 &&
      this.releaseDate() !== '' &&
      this.genre() !== '' &&
      (this.poster() !== null || this.editedMovie() !== null),
  );

  constructor() {
    this.load();
  }

  /** Without a date, the API chooses today. */
  protected load(date?: string): void {
    this.programmingService.getProgramming(date).subscribe({
      next: (programming) => {
        this.programming.set(programming);
        this.failed.set(false);
      },
      error: () => this.failed.set(true),
    });
  }

  protected stateOf(screening: ProgrammedScreening, movies: ProgrammingMovie[]): ScreeningState {
    const startsAt = new Date(screening.startsAt).getTime();
    const now = Date.now();
    if (now < startsAt) {
      return 'upcoming';
    }
    // The length of its movie comes from the catalog sent with the day
    const minutes =
      movies.find((movie) => movie.movieId === screening.movieId)?.durationMinutes ?? 0;
    return now < startsAt + minutes * 60_000 ? 'started' : 'ended';
  }

  protected add(): void {
    const date = this.programming()?.date;
    if (!date) {
      return;
    }
    this.send(
      this.programmingService.createScreening({
        movieId: this.movieId(),
        roomId: this.roomId(),
        startsAt: `${date}T${this.time()}:00`,
        price: this.price(),
      }),
      {},
    );
  }

  protected edit(screening: ProgrammedScreening): void {
    this.editedId.set(screening.screeningId);
    this.editedDay.set(screening.startsAt.slice(0, 10));
    this.editedTime.set(screening.startsAt.slice(11, 16));
    this.editedPrice.set(screening.price);
  }

  protected move(screening: ProgrammedScreening, confirmed = false): void {
    const request = {
      startsAt: `${this.editedDay()}T${this.editedTime()}:00`,
      price: this.editedPrice(),
    };
    this.send(this.programmingService.updateScreening(screening.screeningId, request, confirmed), {
      screening,
      confirm: () => this.move(screening, true),
    });
  }

  protected cancel(screening: ProgrammedScreening, confirmed = false): void {
    this.send(this.programmingService.cancelScreening(screening.screeningId, confirmed), {
      screening,
      confirm: () => this.cancel(screening, true),
    });
  }

  protected confirmPending(): void {
    const change = this.pending();
    this.pending.set(null);
    change?.confirm();
  }

  protected openMovieForm(): void {
    this.title.set('');
    this.synopsis.set('');
    this.durationMinutes.set(0);
    this.releaseDate.set('');
    this.genre.set('');
    this.poster.set(null);
    this.movieError.set(null);
    this.movieMessage.set(null);
    this.editedMovie.set(null);
    this.confirmingArchive.set(false);
    this.movieFormOpen.set(true);
  }

  /** Criterion 3: the form of a new movie, filled with the card of the chosen one. */
  protected chooseMovieToEdit(movieId: string): void {
    const movie = this.programming()?.movies.find((candidate) => candidate.movieId === movieId);
    if (!movie) {
      return;
    }
    this.openMovieForm();
    this.editedMovie.set(movie);
    this.title.set(movie.title);
    this.synopsis.set(movie.synopsis);
    this.durationMinutes.set(movie.durationMinutes);
    this.releaseDate.set(movie.releaseDate);
    this.genre.set(movie.genre);
  }

  protected submitMovie(): void {
    const movie = this.editedMovie();
    if (movie) {
      this.saveMovie(movie);
    } else {
      this.addMovie();
    }
  }

  /** Comfort only: the API checks the poster again, from its first bytes. */
  protected choosePoster(file: File | undefined): void {
    this.movieError.set(null);
    if (file && file.size > MAX_POSTER_BYTES) {
      this.poster.set(null);
      this.movieError.set("L'affiche pèse plus de 2 Mo : choisissez une image plus légère.");
      return;
    }
    this.poster.set(file ?? null);
  }

  protected addMovie(): void {
    const poster = this.poster();
    if (!poster) {
      return;
    }
    const title = this.title().trim();
    this.movieError.set(null);
    this.programmingService
      .createMovie({
        title,
        synopsis: this.synopsis().trim(),
        durationMinutes: this.durationMinutes(),
        genre: this.genre(),
        releaseDate: this.releaseDate(),
        poster,
      })
      .subscribe({
        next: ({ movieId }) => {
          // Criterion 1: the new movie is offered, and already chosen, for the next screening
          this.movieId.set(movieId);
          this.movieMessage.set(
            `« ${title} » est au catalogue : il est choisi pour la nouvelle séance.`,
          );
          this.movieFormOpen.set(false);
          this.load(this.programming()?.date);
        },
        error: (error: unknown) => this.movieError.set(problemMessage(error)),
      });
  }

  /** Without a new poster, the API keeps the current one. */
  private saveMovie(movie: ProgrammingMovie): void {
    const title = this.title().trim();
    this.movieError.set(null);
    this.programmingService
      .updateMovie(movie.movieId, {
        title,
        synopsis: this.synopsis().trim(),
        durationMinutes: this.durationMinutes(),
        genre: this.genre(),
        releaseDate: this.releaseDate(),
        poster: this.poster(),
      })
      .subscribe({
        next: () => this.movieDone(`« ${title} » est enregistré.`),
        error: (error: unknown) => this.movieError.set(problemMessage(error)),
      });
  }

  /** Criterion 6: once confirmed, the movie is archived, never deleted. */
  protected archiveMovie(): void {
    const movie = this.editedMovie();
    if (!movie) {
      return;
    }
    this.confirmingArchive.set(false);
    this.movieError.set(null);
    this.programmingService.archiveMovie(movie.movieId).subscribe({
      next: () => {
        // No longer offered: it leaves the form of a new screening too
        if (this.movieId() === movie.movieId) {
          this.movieId.set('');
        }
        this.movieDone(
          `« ${movie.title} » est archivé : il n'est plus proposé à la programmation.`,
        );
      },
      error: (error: unknown) => this.movieError.set(problemMessage(error)),
    });
  }

  private movieDone(message: string): void {
    this.movieMessage.set(message);
    this.movieFormOpen.set(false);
    this.editedMovie.set(null);
    this.load(this.programming()?.date);
  }

  /**
   * On success the day is read again. On "screening-has-reservations" the manager is asked to confirm, under the screening;
   * any other refusal is shown under the screening concerned, or under the form for a new screening.
   */
  private send(
    change: Observable<unknown>,
    about: { screening?: ProgrammedScreening; confirm?: () => void },
  ): void {
    this.addError.set(null);
    this.rowError.set(null);
    this.pending.set(null);
    change.subscribe({
      next: () => {
        this.editedId.set(null);
        this.load(this.programming()?.date);
      },
      error: (error: unknown) => {
        const { screening, confirm } = about;
        if (screening && confirm && isWarning(error)) {
          this.pending.set({ screening, confirm });
          return;
        }
        const message = problemMessage(error);
        if (screening) {
          this.rowError.set({ screeningId: screening.screeningId, message });
        } else {
          this.addError.set(message);
        }
      },
    });
  }
}

function isWarning(error: unknown): boolean {
  return (
    error instanceof HttpErrorResponse &&
    error.status === 409 &&
    (error.error as { type?: string } | null)?.type === '/errors/screening-has-reservations'
  );
}
