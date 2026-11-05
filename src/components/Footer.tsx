import { FileText } from 'lucide-react';

interface FooterLink {
  label: string;
  href?: string;
  appPage?: boolean;
}

const FOOTER_COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Compress PDF', href: '#compress' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about-us', appPage: true },
      { label: 'Contact Us', href: '#contact' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'FAQ', href: '#faq' },
      { label: 'Help Center', href: '/help-center', appPage: true },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy', appPage: true },
      { label: 'Terms of Service', href: '/terms-of-service', appPage: true },
      { label: 'Cookie Policy', href: '/cookie-policy', appPage: true },
      {
        label: 'Refund & Cancellation Policy',
        href: '/refund-cancellation-policy',
        appPage: true,
      },
    ],
  },
];

export default function Footer({
  onNavigate,
  isRoutedPage,
}: {
  onNavigate: (path: string) => void;
  isRoutedPage: boolean;
}) {
  return (
    <footer className="bg-ink-950 text-ink-200">
      <div className="container-page py-14 sm:py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
                <FileText className="h-5 w-5" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-base font-extrabold text-white">Somo</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-400">
                  File Compression
                </span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-400">
              Compress PDF files with flexible settings for file size and image detail.
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                {col.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) =>
                  link.href ? (
                    <li key={link.label}>
                      <a
                        href={
                          isRoutedPage && !link.appPage
                            ? `/${link.href}`
                            : link.href
                        }
                        onClick={
                          link.appPage
                            ? (event) => {
                                event.preventDefault();
                                onNavigate(link.href!);
                              }
                            : undefined
                        }
                        className="text-sm text-ink-400 transition-colors hover:text-brand-400"
                      >
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <span
                        className="cursor-not-allowed text-sm text-ink-500"
                        title="Coming soon"
                      >
                        {link.label}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-ink-800 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <p className="text-xs text-ink-400">
              © 2026 Somo File Compression. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
