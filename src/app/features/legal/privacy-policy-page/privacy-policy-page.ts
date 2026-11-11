import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [DatePipe, RouterLink],
  selector: 'app-privacy-policy-page',
  templateUrl: './privacy-policy-page.html',
})
export class PrivacyPolicyPage {
  /** Same date as PrivacyPolicy.CurrentVersion in the API, which records it with each new account: change both together. */
  protected readonly version = '2026-10-28';
}
