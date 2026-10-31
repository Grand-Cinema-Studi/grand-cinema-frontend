import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { RegisterUserRequest, User } from '../../../core/auth/models/auth';
import { SignUpPage } from './sign-up-page';

describe('US 2.1 – SignUpPage', () => {
  const lea = {
    userId: 'id-lea',
    email: 'lea.martin@example.com',
    firstName: 'Léa',
    lastName: 'Martin',
    role: 'Customer',
  } as User;

  async function render(
    register: (request: RegisterUserRequest) => Observable<User>,
    returnUrl?: string,
  ) {
    const auth = { register: vi.fn(register) };
    TestBed.configureTestingModule({
      imports: [SignUpPage],
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
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(SignUpPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    const fill = (id: string, value: string) => {
      const input = element.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    const fillValidForm = () => {
      fill('firstName', 'Léa');
      fill('lastName', 'Martin');
      fill('email', 'lea.martin@example.com');
      fill('password', 'Correct-horse-2026');
    };
    const submit = async () => {
      element.querySelector('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    };

    return { auth, navigate, element, fill, fillValidForm, submit };
  }

  it('when the privacy policy is not accepted, then no account is created and the visitor is asked to accept it', async () => {
    const page = await render(() => of(lea));
    page.fillValidForm();

    await page.submit();

    expect(page.auth.register).not.toHaveBeenCalled();
    expect(page.element.textContent).toContain(
      'Vous devez accepter la politique de confidentialité pour créer un compte.',
    );
  });

  it('when the form is valid and the privacy policy accepted, then the account is created and the account page opens', async () => {
    const page = await render(() => of(lea));
    page.fillValidForm();
    page.element.querySelector<HTMLInputElement>('#acceptPrivacyPolicy')!.click();

    await page.submit();

    expect(page.auth.register).toHaveBeenCalledWith({
      firstName: 'Léa',
      lastName: 'Martin',
      email: 'lea.martin@example.com',
      password: 'Correct-horse-2026',
      acceptPrivacyPolicy: true,
    });
    expect(page.navigate).toHaveBeenCalledWith('/account');
  });

  it('when the password is shorter than 12 characters, then no account is created', async () => {
    const page = await render(() => of(lea));
    page.fillValidForm();
    page.fill('password', 'too-short');
    page.element.querySelector<HTMLInputElement>('#acceptPrivacyPolicy')!.click();

    await page.submit();

    expect(page.auth.register).not.toHaveBeenCalled();
  });

  it('when the email address is already used, then an explicit message is shown', async () => {
    const page = await render(() =>
      throwError(
        () => new HttpErrorResponse({ status: 409, error: { type: '/errors/email-already-used' } }),
      ),
    );
    page.fillValidForm();
    page.element.querySelector<HTMLInputElement>('#acceptPrivacyPolicy')!.click();

    await page.submit();

    expect(page.element.querySelector('[role="alert"]')?.textContent).toContain(
      'Un compte existe déjà avec cette adresse e-mail.',
    );
    expect(page.navigate).not.toHaveBeenCalled();
  });

  it('when the form is displayed, then the privacy policy can be read through a link', async () => {
    const page = await render(() => of(lea));

    const link = page.element.querySelector<HTMLAnchorElement>(
      'label[for="acceptPrivacyPolicy"] a',
    );
    expect(link?.getAttribute('href')).toBe('/privacy-policy');
  });

  it('when the visitor was sent to the sign-up by another page, then this page opens after the sign-up', async () => {
    const page = await render(() => of(lea), '/movies/id-bird?screening=id-screening');
    page.fillValidForm();
    page.element.querySelector<HTMLInputElement>('#acceptPrivacyPolicy')!.click();

    await page.submit();

    expect(page.navigate).toHaveBeenCalledWith('/movies/id-bird?screening=id-screening');
  });
});
