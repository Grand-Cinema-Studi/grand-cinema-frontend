import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  it('when the application starts, then the layout is displayed', async () => {
    // The layout shows the sign-in state, read by AuthService, which needs HttpClient
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient()],
    });
    const fixture = TestBed.createComponent(App);

    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-layout')).not.toBeNull();
  });
});
