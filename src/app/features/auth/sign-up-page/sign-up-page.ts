import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { problemMessage } from '../../../core/errors/problem-message';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-sign-up-page',
  templateUrl: './sign-up-page.html',
})
export class SignUpPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // Same limits as the API, to help the visitor before sending; the API still checks everything
  protected readonly form = inject(NonNullableFormBuilder).group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    password: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(128)]],
    acceptPrivacyPolicy: [false, Validators.requiredTrue],
  });

  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);

  /** A field shows its error once the visitor has left it, or has tried to send the form. */
  protected showsError(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.sending.set(true);
    this.error.set(null);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl('/account'),
      error: (error: unknown) => {
        this.error.set(problemMessage(error));
        this.sending.set(false);
      },
    });
  }
}
