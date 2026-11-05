import type { SitePageKey } from '@/lib/legalRoutes';

export const SITE_ORIGIN =
  'https://somo-file-compression-jhqk-632glofah-waqas-e326.vercel.app';

export interface PageSeo {
  title: string;
  description: string;
}

export const HOME_SEO: PageSeo = {
  title: 'Compress PDF Online Up to 10 MB | Somo File Compression',
  description:
    'Compress PDF files online with three settings for file size and image detail. Upload a PDF up to 10 MB, choose a mode, and download the result.',
};

export const SITE_PAGE_SEO: Record<SitePageKey, PageSeo> = {
  about: {
    title: 'About Us | Somo File Compression',
    description:
      'Learn about Somo File Compression, a simple online tool for compressing PDF files up to 10 MB.',
  },
  help: {
    title: 'PDF Compression Help Center | Somo File Compression',
    description:
      'Get help with Somo PDF compression, account access, compression modes, the 10 MB upload limit, and common file errors.',
  },
  privacy: {
    title: 'Privacy Policy | Somo File Compression',
    description:
      'Read how Somo File Compression handles account details, contact submissions, and PDF processing.',
  },
  terms: {
    title: 'Terms of Service | Somo File Compression',
    description:
      'Review the terms and processing limits for using the Somo File Compression online PDF tool.',
  },
  cookies: {
    title: 'Cookie Policy | Somo File Compression',
    description:
      'Learn about persistent authentication storage and tracking technologies on Somo File Compression.',
  },
  refunds: {
    title: 'Refund & Cancellation Policy | Somo File Compression',
    description:
      'See the refund and cancellation policy for Somo File Compression, which currently has no paid plans.',
  },
};

export function updatePageSeo(
  page: PageSeo | null,
  canonicalPath: string | null,
): void {
  const { document } = window;
  const setMeta = (
    selector: string,
    attribute: 'name' | 'property',
    key: string,
    content: string,
  ) => {
    let element = document.head.querySelector<HTMLMetaElement>(selector);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, key);
      document.head.append(element);
    }
    element.content = content;
  };

  const canonical = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );

  if (!page || !canonicalPath) {
    document.title = 'Page not found | Somo File Compression';
    setMeta('meta[name="robots"]', 'name', 'robots', 'noindex,follow');
    setMeta('meta[name="googlebot"]', 'name', 'googlebot', 'noindex,follow');
    canonical?.remove();
    document.getElementById('site-structured-data')?.remove();
    return;
  }

  const canonicalUrl = new URL(canonicalPath, `${SITE_ORIGIN}/`).href;
  document.title = page.title;
  setMeta('meta[name="description"]', 'name', 'description', page.description);
  setMeta('meta[name="robots"]', 'name', 'robots', 'index,follow');
  setMeta('meta[name="googlebot"]', 'name', 'googlebot', 'index,follow');
  setMeta('meta[property="og:title"]', 'property', 'og:title', page.title);
  setMeta(
    'meta[property="og:description"]',
    'property',
    'og:description',
    page.description,
  );
  setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
  setMeta(
    'meta[property="og:site_name"]',
    'property',
    'og:site_name',
    'Somo File Compression',
  );
  setMeta(
    'meta[property="og:url"]',
    'property',
    'og:url',
    canonicalUrl,
  );
  setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary');
  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', page.title);
  setMeta(
    'meta[name="twitter:description"]',
    'name',
    'twitter:description',
    page.description,
  );

  const canonicalElement =
    canonical ?? document.createElement('link');
  canonicalElement.rel = 'canonical';
  canonicalElement.href = canonicalUrl;
  if (!canonical) document.head.append(canonicalElement);

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        name: 'Somo File Compression',
        url: `${SITE_ORIGIN}/`,
      },
      {
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        name: page.title,
        description: page.description,
        url: canonicalUrl,
        isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
      },
    ],
  };
  let structuredDataElement = document.getElementById(
    'site-structured-data',
  ) as HTMLScriptElement | null;
  if (!structuredDataElement) {
    structuredDataElement = document.createElement('script');
    structuredDataElement.id = 'site-structured-data';
    structuredDataElement.type = 'application/ld+json';
    document.head.append(structuredDataElement);
  }
  structuredDataElement.textContent = JSON.stringify(structuredData);
}
