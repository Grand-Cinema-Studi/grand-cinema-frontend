import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { safeReturnUrl } from '../../../core/auth/return-url';
import { problemMessage } from '../../../core/errors/problem-message';
import { PasswordToggle } from '../../../shared/password-toggle/password-toggle';

/** A-08: the confirmation must repeat the password. Checked on the group, as it compares two fields. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value as string;
  const confirmation = group.get('confirmPassword')?.value as string;
  return confirmation === '' || confirmation === password ? null : { passwordsDiffer: true };
}

@Component({
  imports: [ReactiveFormsModule, RouterLink, PasswordToggle],
  selector: 'app-sign-up-page',
  templateUrl: './sign-up-page.html',
})
export class SignUpPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly returnUrl = inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl');

  // Same limits as the API, to help the visitor before sending; the API still checks everything.
  // The confirmation (A-08) is checked here only: it is not sent.
  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
      password: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(128)]],
      confirmPassword: ['', Validators.required],
      acceptPrivacyPolicy: [false, Validators.requiredTrue],
    },
    { validators: passwordsMatch },
  );

  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);
  /** A-07: each password field is hidden until the visitor asks to see it. */
  protected readonly passwordVisible = signal(false);
  protected readonly confirmationVisible = signal(false);

  /** A-08: the message under the confirmation, once the visitor has left it or tried to send the form. */
  protected confirmationError(): string | null {
    const confirmation = this.form.controls.confirmPassword;
    if (!confirmation.touched) {
      return null;
    }
    if (confirmation.hasError('required')) {
      return 'Confirmez votre mot de passe.';
    }
    return this.form.hasError('passwordsDiffer')
      ? 'Les deux mots de passe ne sont pas identiques.'
      : null;
  }

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
    // The confirmation stays in the browser: the API receives the password once
    const { firstName, lastName, email, password, acceptPrivacyPolicy } = this.form.getRawValue();
    this.auth.register({ firstName, lastName, email, password, acceptPrivacyPolicy }).subscribe({
      next: () => void this.router.navigateByUrl(safeReturnUrl(this.returnUrl)),
      error: (error: unknown) => {
        this.error.set(problemMessage(error));
        this.sending.set(false);
      },
    });
  }
}
