import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LegalNoticePage } from './legal-notice-page';

describe('US 1.2 – LegalNoticePage', () => {
  it('when the legal notice is displayed, then the publisher and the host are shown', async () => {
    TestBed.configureTestingModule({ imports: [LegalNoticePage], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(LegalNoticePage);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).toContain('Éditeur du site');
    expect(text).toContain('Amazon Web Services EMEA SARL');
  });
});
