import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { safeReturnUrl } from '../../../core/auth/return-url';
import { problemMessage } from '../../../core/errors/problem-message';
import { PasswordToggle } from '../../../shared/password-toggle/password-toggle';

@Component({
  imports: [ReactiveFormsModule, RouterLink, PasswordToggle],
  selector: 'app-sign-in-page',
  templateUrl: './sign-in-page.html',
})
export class SignInPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly returnUrl = inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl');

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);
  /** A-07: the password is hidden until the visitor asks to see it. */
  protected readonly passwordVisible = signal(false);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.sending.set(true);
    this.error.set(null);
    this.auth.signIn(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl(safeReturnUrl(this.returnUrl)),
      error: (error: unknown) => {
        this.error.set(problemMessage(error));
        this.sending.set(false);
      },
    });
  }
}
