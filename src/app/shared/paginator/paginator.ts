import { Component, computed, input, output } from '@angular/core';

/** Up to this number of pages, every page number is shown. */
const ALL_PAGES_UP_TO = 7;

@Component({
  selector: 'app-paginator',
  templateUrl: './paginator.html',
})
export class Paginator {
  readonly page = input.required<number>();
  readonly pageCount = input.required<number>();
  readonly pageChange = output<number>();

  /** Page numbers to offer, with "…" for the pages left out: 1 … 9 10 11 … 19. */
  protected readonly items = computed<(number | '…')[]>(() => {
    const count = this.pageCount();
    const page = this.page();
    if (count <= ALL_PAGES_UP_TO) {
      return Array.from({ length: count }, (_, index) => index + 1);
    }
    const shown = [...new Set([1, page - 1, page, page + 1, count])]
      .filter((number) => number >= 1 && number <= count)
      .sort((a, b) => a - b);
    const items: (number | '…')[] = [];
    shown.forEach((number, index) => {
      const previous = shown[index - 1];
      if (previous !== undefined && number - previous === 2) {
        items.push(previous + 1);
      } else if (previous !== undefined && number - previous > 2) {
        items.push('…');
      }
      items.push(number);
    });
    return items;
  });

  protected go(page: number): void {
    if (page >= 1 && page <= this.pageCount() && page !== this.page()) {
      this.pageChange.emit(page);
    }
  }
}
