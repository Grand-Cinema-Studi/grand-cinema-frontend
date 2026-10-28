import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { User } from '../../../core/auth/models/auth';
import { AccountPage } from './account-page';

describe('US 2.1 – AccountPage', () => {
  const lea: User = {
    userId: 'id-lea',
    email: 'lea.martin@example.com',
    firstName: 'Léa',
    lastName: 'Martin',
    role: 'Customer',
  };

  async function render(deleteAccount: () => Observable<void> = () => of(undefined)) {
    const auth = {
      getProfile: vi.fn(() => of(lea)),
      deleteAccount: vi.fn(deleteAccount),
      signOut: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [AccountPage],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(AccountPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    const click = async (label: string) => {
      const button = Array.from(element.querySelectorAll('button')).find(
        (candidate) => candidate.textContent?.trim() === label,
      );
      button!.click();
      await fixture.whenStable();
    };

    return { auth, navigate, element, click };
  }

  it('when the account page opens, then the profile of the signed-in visitor is shown', async () => {
    const page = await render();

    expect(page.element.textContent).toContain('Léa Martin');
    expect(page.element.textContent).toContain('lea.martin@example.com');
  });

  it('when the visitor asks to delete the account, then a confirmation is asked before anything is deleted', async () => {
    const page = await render();

    await page.click('Supprimer mon compte');

    expect(page.auth.deleteAccount).not.toHaveBeenCalled();
    expect(page.element.textContent).toContain(
      'Confirmez-vous la suppression définitive de votre compte ?',
    );
  });

  it('when the deletion is confirmed, then the account is deleted and the visitor is told what was kept', async () => {
    const page = await render();

    await page.click('Supprimer mon compte');
    await page.click('Confirmer la suppression');

    expect(page.auth.deleteAccount).toHaveBeenCalledTimes(1);
    expect(page.element.querySelector('[role="status"]')?.textContent).toContain(
      'Votre compte a été supprimé.',
    );
  });

  it('when the deletion is cancelled, then nothing is deleted', async () => {
    const page = await render();

    await page.click('Supprimer mon compte');
    await page.click('Annuler');

    expect(page.auth.deleteAccount).not.toHaveBeenCalled();
    expect(page.element.textContent).not.toContain('Confirmez-vous');
  });

  it('when the visitor signs out, then the session is forgotten and the home page opens', async () => {
    const page = await render();

    await page.click('Se déconnecter');

    expect(page.auth.signOut).toHaveBeenCalled();
    expect(page.navigate).toHaveBeenCalledWith('/');
  });
});
