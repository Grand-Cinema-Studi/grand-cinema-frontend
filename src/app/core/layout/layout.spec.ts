import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Layout } from './layout';

describe('Layout', () => {
  async function render(): Promise<HTMLElement> {
    TestBed.configureTestingModule({ imports: [Layout], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Layout);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('when the layout is displayed, then the header shows the cinema name', async () => {
    const element = await render();

    expect(element.querySelector('header')?.textContent).toContain('Grand Cinéma');
  });

  it('when the layout is displayed, then the pages are shown between the header and the footer', async () => {
    const element = await render();

    expect(element.querySelector('main router-outlet')).not.toBeNull();
    expect(element.querySelector('footer')).not.toBeNull();
  });
});
