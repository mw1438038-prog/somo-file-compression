import { CheckCircle2, MousePointerClick, Layers, Scale, Smartphone } from 'lucide-react';

const POINTS: { icon: typeof CheckCircle2; text: string }[] = [
  { icon: MousePointerClick, text: 'Easy to use — no complicated workflow.' },
  { icon: Layers, text: 'Flexible compression choices for different needs.' },
  { icon: Scale, text: 'Simple file-size comparison before you download.' },
  { icon: Smartphone, text: 'Responsive on desktop and mobile.' },
];

export default function WhyChoose() {
  return (
    <section className="scroll-mt-nav bg-ink-50/60 py-16 sm:py-20 lg:py-24">
      <div className="container-page">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-sm font-bold uppercase tracking-wider text-brand-600">
              Why Choose Somo
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
              Built for simplicity and results
            </h2>
            <p className="mt-4 text-ink-500">
              Somo PDF Compressor focuses on the essentials: a clean interface, clear
              compression choices, and a straightforward way to see your results.
            </p>
            <ul className="mt-8 space-y-4">
              {POINTS.map((point) => {
                const Icon = point.icon;
                return (
                  <li key={point.text} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="pt-1.5 text-sm font-medium text-ink-700">
                      {point.text}
                    </span>
                  </li>
                );
              })}
            </ul>
            <a
              href="#compress"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98]"
            >
              Try It Now
            </a>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-brand-100/40 blur-2xl" />
            <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-lift sm:p-8">
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                  Illustrative example
                </span>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-ink-100 bg-ink-50/60 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink-700">Original file</span>
                    <span className="font-bold text-ink-900">4.82 MB</span>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-ink-200">
                    <div className="h-full w-full rounded-full bg-ink-400" />
                  </div>
                </div>
                <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-brand-700">Compressed file</span>
                    <span className="font-bold text-brand-600">1.24 MB</span>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-brand-100">
                    <div className="h-full w-1/4 rounded-full bg-brand-600" />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 py-3 text-sm font-bold text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  You saved 74%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
