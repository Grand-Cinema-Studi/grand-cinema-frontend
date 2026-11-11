import { Component } from '@angular/core';

interface CinemaPromise {
  icon: string;
  title: string;
  detail: string;
}

/** Presentation of the rooms of the cinema, from the mockup: static content, no link. */
@Component({
  selector: 'app-cinema-experience',
  templateUrl: './cinema-experience.html',
})
export class CinemaExperience {
  protected readonly promises: readonly CinemaPromise[] = [
    {
      icon: 'icons/audio-lines.svg',
      title: 'Un son qui vous enveloppe.',
      detail: 'Dolby Atmos immersif',
    },
    {
      icon: 'icons/armchair.svg',
      title: "La meilleure place, c'est chaque place.",
      detail: "De l'espace pour se détendre.",
    },
    {
      icon: 'icons/projector.svg',
      title: 'Une image exceptionnelle, à chaque instant.',
      detail: 'Projection laser 4K',
    },
  ];
}
