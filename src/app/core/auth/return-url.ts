/**
 * The page to open after the sign-in or the sign-up: only a page of this site.
 * "//other-site.test" or "https://…" would send the visitor elsewhere (open redirect).
 */
export function safeReturnUrl(url: string | null): string {
  return url?.startsWith('/') && !url.startsWith('//') ? url : '/account';
}
