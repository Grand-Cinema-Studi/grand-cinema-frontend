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
