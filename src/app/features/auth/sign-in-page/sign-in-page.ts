import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { problemMessage } from '../../../core/errors/problem-message';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-sign-in-page',
  templateUrl: './sign-in-page.html',
})
export class SignInPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly returnUrl = inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl');

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.sending.set(true);
    this.error.set(null);
    this.auth.signIn(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl(this.destination()),
      error: (error: unknown) => {
        this.error.set(problemMessage(error));
        this.sending.set(false);
      },
    });
  }

  /** Only a page of this site: "//other-site.test" or "https://…" would send the visitor elsewhere (open redirect). */
  private destination(): string {
    const url = this.returnUrl;
    return url?.startsWith('/') && !url.startsWith('//') ? url : '/account';
  }
}
