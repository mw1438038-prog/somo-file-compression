export const SITE_PAGE_PATHS = {
  about: '/about-us',
  help: '/help-center',
  privacy: '/privacy-policy',
  terms: '/terms-of-service',
  cookies: '/cookie-policy',
  refunds: '/refund-cancellation-policy',
} as const;

export type SitePageKey = keyof typeof SITE_PAGE_PATHS;

export function getSitePageKey(pathname: string): SitePageKey | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  return (
    (Object.entries(SITE_PAGE_PATHS).find(
      ([, path]) => path === normalizedPath,
    )?.[0] as SitePageKey | undefined) ?? null
  );
}
