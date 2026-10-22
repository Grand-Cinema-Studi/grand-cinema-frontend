/** Number of movies shown at once in a list of movies. */
export const MOVIES_PER_PAGE = 6;

export function pageCount(itemCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(itemCount / pageSize));
}

/** Items of a page, pages being numbered from 1. */
export function pageItems<T>(items: readonly T[], page: number, pageSize: number): T[] {
  return items.slice((page - 1) * pageSize, page * pageSize);
}

/** Page, numbered from 1, that holds the item at this index. */
export function pageOfIndex(index: number, pageSize: number): number {
  return Math.floor(index / pageSize) + 1;
}
