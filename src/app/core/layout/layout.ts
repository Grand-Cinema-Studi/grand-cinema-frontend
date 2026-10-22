import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

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

  protected readonly legalMentions = [
    'Politique de confidentialité',
    'Termes & conditions',
    'Cookies',
  ] as const;
}
