import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth/auth.service';

interface FooterGroup {
  title: string;
  /** An entry leads to a section of the home page, by its id; without one, it leads nowhere yet. */
  entries: { label: string; fragment?: string }[];
}

@Component({
  imports: [RouterLink, RouterOutlet],
  selector: 'app-layout',
  templateUrl: './layout.html',
})
export class Layout {
  protected readonly auth = inject(AuthService);

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

  /** A mention with a link leads to its page; the others have no page yet. */
  protected readonly legalMentions: readonly { label: string; link?: string }[] = [
    { label: 'Politique de confidentialité', link: '/privacy-policy' },
    { label: 'Termes & conditions' },
    { label: 'Cookies' },
  ];
}
