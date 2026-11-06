import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { CookieBanner } from '../consent/cookie-banner/cookie-banner';
import { CookieConsentService } from '../consent/cookie-consent.service';

interface FooterGroup {
  title: string;
  /** An entry leads to a section of the home page, by its id; without one, it leads nowhere yet. */
  entries: { label: string; fragment?: string }[];
}

@Component({
  imports: [CookieBanner, RouterLink, RouterOutlet],
  selector: 'app-layout',
  templateUrl: './layout.html',
})
export class Layout {
  protected readonly auth = inject(AuthService);
  /** Phones only: the menu of the header, opened by its button. */
  protected readonly menuOpen = signal(false);
  /** The footer button « Cookies » forgets the choice: the banner shows again. */
  protected readonly consent = inject(CookieConsentService);

  protected readonly footerGroups: readonly FooterGroup[] = [
    {
      title: 'Nos salles',
      entries: [
        { label: "À l'affiche", fragment: 'schedule' },
        { label: 'Prochainement', fragment: 'featured' },
      ],
    },
    { title: 'Grand Cinéma', entries: [{ label: 'Notre cinéma', fragment: 'cinema' }] },
    { title: 'À propos', entries: [{ label: 'Contact' }, { label: 'À propos' }] },
  ];

  protected readonly socialNetworks = [
    { name: 'Instagram', icon: 'icons/instagram.svg' },
    { name: 'Facebook', icon: 'icons/facebook.svg' },
    { name: 'YouTube', icon: 'icons/youtube.svg' },
  ] as const;

  /** The legal pages, linked from the footer; « Cookies » is a button of the template. */
  protected readonly legalMentions: readonly { label: string; link: string }[] = [
    { label: 'Politique de confidentialité', link: '/privacy-policy' },
    { label: 'Conditions générales de vente', link: '/terms-of-sale' },
    { label: 'Mentions légales', link: '/legal-notice' },
  ];
}
