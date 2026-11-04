import { HttpErrorResponse } from '@angular/common/http';

/** French messages, chosen from the "type" of the Problem Details sent by the API (its "title" is English). */
const messages = new Map<string, string>([
  ['/errors/email-already-used', 'Un compte existe déjà avec cette adresse e-mail.'],
  ['/errors/invalid-credentials', "L'adresse e-mail ou le mot de passe est incorrect."],
  ['/errors/user-not-found', "Ce compte n'existe plus."],
  ['/errors/validation', 'Certains champs ne sont pas valides.'],
  ['/errors/not-enough-seats', 'Il ne reste plus assez de places pour cette séance.'],
  ['/errors/screening-started', 'Cette séance a déjà commencé.'],
  ['/errors/screening-not-found', "Cette séance n'existe plus."],
  ['/errors/reservation-not-found', 'Cette réservation est introuvable.'],
  ['/errors/reservation-confirmed', 'Une réservation payée ne peut pas être annulée en ligne.'],
  [
    '/errors/seat-limit-reached',
    'Vous avez déjà le nombre maximum de places (10, bloquées ou payées) pour cette séance.',
  ],
  ['/errors/hold-expired', 'Le délai de 10 minutes est écoulé : bloquez à nouveau vos places.'],
  ['/errors/reservation-paid', 'Cette réservation est déjà payée.'],
  [
    '/errors/room-not-available',
    'La salle est déjà occupée à cette heure (nettoyage de 15 minutes compris).',
  ],
  ['/errors/room-not-found', "Cette salle n'existe plus."],
  ['/errors/movie-not-found', "Ce film n'existe plus."],
]);

const unavailable = 'Le service est momentanément indisponible. Réessayez dans quelques instants.';

export function problemMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return unavailable;
  }
  if (error.status === 429) {
    return 'Trop de tentatives. Réessayez dans une minute.';
  }
  const type = (error.error as { type?: string } | null)?.type;
  return (type && messages.get(type)) || unavailable;
}
