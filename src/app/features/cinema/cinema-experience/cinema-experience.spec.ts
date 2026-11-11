import { TestBed } from '@angular/core/testing';
import { CinemaExperience } from './cinema-experience';

describe('CinemaExperience', () => {
  async function render(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(CinemaExperience);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('when the section is displayed, then the photo of a room, the title and the three promises are shown', async () => {
    const element = await render();

    expect(element.querySelector('img[src="images/cinema-interior.jpg"]')).not.toBeNull();
    expect(element.querySelector('h2')?.textContent).toContain('Le cinéma,');
    const promises = Array.from(element.querySelectorAll('li'), (item) => item.textContent);
    expect(promises.length).toBe(3);
    expect(promises[0]).toContain('Dolby Atmos immersif');
    expect(promises[1]).toContain("De l'espace pour se détendre.");
    expect(promises[2]).toContain('Projection laser 4K');
  });

  it('when the section is displayed, then it offers no link nor button', async () => {
    const element = await render();

    expect(element.querySelectorAll('a, button').length).toBe(0);
  });
});
