import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Paginator } from './paginator';

@Component({
  imports: [Paginator],
  template: `<app-paginator
    [page]="page()"
    [pageCount]="pageCount()"
    (pageChange)="page.set($event)"
  />`,
})
class Host {
  readonly page = signal(1);
  readonly pageCount = signal(4);
}

describe('Paginator', () => {
  async function render(page: number, pageCount: number) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.page.set(page);
    fixture.componentInstance.pageCount.set(pageCount);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const labels = () =>
      Array.from(element.querySelectorAll('nav li'), (item) => item.textContent?.trim());
    const click = async (selector: string) => {
      element.querySelector<HTMLButtonElement>(selector)?.click();
      await fixture.whenStable();
    };
    return { fixture, element, labels, click };
  }

  it('when there is only one page, then no pagination is shown', async () => {
    const { element } = await render(1, 1);

    expect(element.querySelector('nav')).toBeNull();
  });

  it('when there are a few pages, then every page is offered and the current one is marked', async () => {
    const { element, labels } = await render(2, 4);

    expect(labels()).toEqual(['1', '2', '3', '4']);
    expect(element.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('2');
  });

  it('when there are many pages, then the first, the last and the neighbours of the current one are offered', async () => {
    const { labels } = await render(10, 19);

    expect(labels()).toEqual(['1', '…', '9', '10', '11', '…', '19']);
  });

  it('when a page number is chosen, then that page is shown', async () => {
    const { fixture, click } = await render(1, 4);

    await click('button[data-page="3"]');

    expect(fixture.componentInstance.page()).toBe(3);
  });

  it('when "next" and "previous" are pressed, then the following and preceding pages are shown', async () => {
    const { fixture, click } = await render(2, 4);

    await click('button[aria-label="Page suivante"]');
    expect(fixture.componentInstance.page()).toBe(3);
    await click('button[aria-label="Page précédente"]');
    expect(fixture.componentInstance.page()).toBe(2);
  });

  it('when the first page is shown, then "previous" is disabled, and on the last page "next" is', async () => {
    const first = await render(1, 4);
    expect(
      first.element.querySelector<HTMLButtonElement>('button[aria-label="Page précédente"]')
        ?.disabled,
    ).toBe(true);

    TestBed.resetTestingModule();
    const last = await render(4, 4);
    expect(
      last.element.querySelector<HTMLButtonElement>('button[aria-label="Page suivante"]')?.disabled,
    ).toBe(true);
  });
});
