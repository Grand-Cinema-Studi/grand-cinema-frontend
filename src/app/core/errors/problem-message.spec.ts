import { HttpErrorResponse } from '@angular/common/http';
import { problemMessage } from './problem-message';

describe('US 2.1 – problemMessage', () => {
  const problem = (status: number, type?: string) =>
    new HttpErrorResponse({ status, error: type ? { type } : null });

  it('when the api sends a known error type, then the matching French message is returned', () => {
    expect(problemMessage(problem(409, '/errors/email-already-used'))).toBe(
      'Un compte existe déjà avec cette adresse e-mail.',
    );
    expect(problemMessage(problem(401, '/errors/invalid-credentials'))).toBe(
      "L'adresse e-mail ou le mot de passe est incorrect.",
    );
  });

  it('when a reservation is refused, then the matching French message is returned', () => {
    expect(problemMessage(problem(409, '/errors/not-enough-seats'))).toBe(
      'Il ne reste plus assez de places pour cette séance.',
    );
    expect(problemMessage(problem(409, '/errors/screening-started'))).toBe(
      'Cette séance a déjà commencé.',
    );
  });

  it('when there were too many attempts, then the visitor is asked to wait', () => {
    expect(problemMessage(problem(429))).toBe('Trop de tentatives. Réessayez dans une minute.');
  });

  it('when the error is unknown, then a generic message is returned', () => {
    expect(problemMessage(problem(500))).toContain('momentanément indisponible');
    expect(problemMessage(new Error('Network error'))).toContain('momentanément indisponible');
  });
});
