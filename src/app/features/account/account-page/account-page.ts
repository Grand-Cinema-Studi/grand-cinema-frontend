import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of, startWith } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { User } from '../../../core/auth/models/auth';
import { problemMessage } from '../../../core/errors/problem-message';

type ProfileState = { status: 'loading' } | { status: 'loaded'; user: User } | { status: 'failed' };

@Component({
  imports: [RouterLink],
  selector: 'app-account-page',
  templateUrl: './account-page.html',
})
export class AccountPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly profile = toSignal(
    this.auth.getProfile().pipe(
      map((user): ProfileState => ({ status: 'loaded', user })),
      catchError(() => of<ProfileState>({ status: 'failed' })),
      startWith<ProfileState>({ status: 'loading' }),
    ),
    { initialValue: { status: 'loading' } as ProfileState },
  );

  /** The deletion cannot be undone: a first click only asks for a confirmation. */
  protected readonly confirmingDeletion = signal(false);
  protected readonly deleted = signal(false);
  protected readonly error = signal<string | null>(null);

  protected signOut(): void {
    this.auth.signOut();
    void this.router.navigateByUrl('/');
  }

  protected deleteAccount(): void {
    this.error.set(null);
    this.auth.deleteAccount().subscribe({
      next: () => this.deleted.set(true),
      error: (error: unknown) => this.error.set(problemMessage(error)),
    });
  }
}
