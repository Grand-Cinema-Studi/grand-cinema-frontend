import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CookieConsentService } from '../cookie-consent.service';

/** US 1.2: at the first visit, refuse or accept the non-essential cookies; the page stays usable below. */
@Component({
  imports: [RouterLink],
  selector: 'app-cookie-banner',
  templateUrl: './cookie-banner.html',
})
export class CookieBanner {
  protected readonly consent = inject(CookieConsentService);
}
