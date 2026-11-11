import { Component, input, model } from '@angular/core';

/**
 * A-07: the eye button inside a password field. The page keeps the state and sets the type of its input;
 * aria-pressed tells screen readers whether the password is shown.
 */
@Component({
  selector: 'app-password-toggle',
  templateUrl: './password-toggle.html',
})
export class PasswordToggle {
  /** Two-way binding: [(visible)]="passwordVisible". */
  readonly visible = model.required<boolean>();
  /** Id of the input it shows or hides. */
  readonly controls = input.required<string>();
}
