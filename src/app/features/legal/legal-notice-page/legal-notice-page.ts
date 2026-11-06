import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Legal notice (LCEN, article 6): publisher, publication director, host. Demonstration text. */
@Component({
  imports: [RouterLink],
  selector: 'app-legal-notice-page',
  templateUrl: './legal-notice-page.html',
})
export class LegalNoticePage {}
