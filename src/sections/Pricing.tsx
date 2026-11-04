import { FileText, Check } from 'lucide-react';

const FEATURES = [
  'PDF compression with three levels',
  'Up to 10 MB per file',
  'No registration fees, no hidden costs',
  'Unlimited compressions',
  'Secure file processing',
  'Download your optimized PDF instantly',
];

export default function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-nav py-16 sm:py-20 lg:py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-brand-600">
            Pricing
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
            Everything is free
          </h2>
          <p className="mt-4 text-ink-500">
            Somo File Compression is completely free for everyone during our initial launch.
            No paid plans, no subscriptions, no credit card required.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-lg">
          <div className="relative rounded-3xl border border-brand-600 bg-white p-8 shadow-lift">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-4 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
              Free Forever
            </span>

            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600">
                <FileText className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-ink-900">Free Plan</h3>
                <p className="text-sm text-ink-400">For everyone</p>
              </div>
            </div>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-ink-900">$0</span>
              <span className="text-sm font-medium text-ink-400">/ forever</span>
            </div>

            <ul className="mt-6 space-y-3">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm text-ink-600">{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="#compress"
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98]"
            >
              Start Compressing — It's Free
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
