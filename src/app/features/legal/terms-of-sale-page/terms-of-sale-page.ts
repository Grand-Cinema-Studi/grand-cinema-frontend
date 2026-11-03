import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [DatePipe, RouterLink],
  selector: 'app-terms-of-sale-page',
  templateUrl: './terms-of-sale-page.html',
})
export class TermsOfSalePage {
  /** Same date as TermsOfSale.CurrentVersion in the API, which records it with each payment: change both together. */
  protected readonly version = '2026-11-02';
}
