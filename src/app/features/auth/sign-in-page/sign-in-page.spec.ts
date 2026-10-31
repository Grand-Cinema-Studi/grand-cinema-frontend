import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { User } from '../../../core/auth/models/auth';
import { SignInPage } from './sign-in-page';

describe('US 2.1 – SignInPage', () => {
  const lea = {
    userId: 'id-lea',
    email: 'lea.martin@example.com',
    firstName: 'Léa',
    lastName: 'Martin',
    role: 'Customer',
  } as User;

  async function render(signIn: () => Observable<User>, returnUrl?: string) {
    const auth = { signIn: vi.fn(signIn) };
    TestBed.configureTestingModule({
      imports: [SignInPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}) },
          },
        },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(SignInPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    const signInAs = async (email: string, password: string) => {
      for (const [id, value] of [
        ['email', email],
        ['password', password],
      ]) {
        const input = element.querySelector<HTMLInputElement>(`#${id}`)!;
        input.value = value;
        input.dispatchEvent(new Event('input'));
      }
      element.querySelector('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    };

    return { auth, navigate, element, signInAs };
  }

  it('when the email and the password are right, then the visitor is signed in and the account page opens', async () => {
    const page = await render(() => of(lea));

    await page.signInAs('lea.martin@example.com', 'Correct-horse-2026');

    expect(page.auth.signIn).toHaveBeenCalledWith({
      email: 'lea.martin@example.com',
      password: 'Correct-horse-2026',
    });
    expect(page.navigate).toHaveBeenCalledWith('/account');
  });

  it('when the visitor was sent to the sign-in by another page, then this page opens after the sign-in', async () => {
    const page = await render(() => of(lea), '/movies');

    await page.signInAs('lea.martin@example.com', 'Correct-horse-2026');

    expect(page.navigate).toHaveBeenCalledWith('/movies');
  });

  it('when the return address leads to another site, then the account page opens instead', async () => {
    const page = await render(() => of(lea), '//other-site.test');

    await page.signInAs('lea.martin@example.com', 'Correct-horse-2026');

    expect(page.navigate).toHaveBeenCalledWith('/account');
  });

  it('when the credentials are wrong, then a message that does not say which one is wrong is shown', async () => {
    const page = await render(() =>
      throwError(
        () =>
          new HttpErrorResponse({ status: 401, error: { type: '/errors/invalid-credentials' } }),
      ),
    );

    await page.signInAs('lea.martin@example.com', 'Wrong-password-2026');

    expect(page.element.querySelector('[role="alert"]')?.textContent).toContain(
      "L'adresse e-mail ou le mot de passe est incorrect.",
    );
    expect(page.navigate).not.toHaveBeenCalled();
  });

  it('when the visitor goes from the sign-in to the sign-up, then the page asked for is kept', async () => {
    const page = await render(() => of(lea), '/movies/id-bird?screening=id-screening');

    const link = page.element.querySelector<HTMLAnchorElement>('a[href^="/sign-up"]');
    const query = new URLSearchParams(link?.getAttribute('href')?.split('?')[1]);
    expect(query.get('returnUrl')).toBe('/movies/id-bird?screening=id-screening');
  });
});
