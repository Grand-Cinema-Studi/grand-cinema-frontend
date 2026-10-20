import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';

describe('NotFound', () => {
  it('when an unknown address is opened, then the "page not found" message is shown', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/unknown-address');

    expect(harness.routeNativeElement?.textContent).toContain('Page introuvable');
  });
});
