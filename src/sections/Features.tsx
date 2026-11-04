import { Zap, Layers, MousePointerClick, Scale, ShieldCheck, Download } from 'lucide-react';

const FEATURES: {
  icon: typeof Zap;
  title: string;
  description: string;
}[] = [
  {
    icon: Zap,
    title: 'Fast PDF Compression',
    description: 'Your files are processed quickly so you get results in seconds.',
  },
  {
    icon: Layers,
    title: 'Three Compression Levels',
    description: 'Pick from Extreme, Recommended, or Less to match your needs.',
  },
  {
    icon: MousePointerClick,
    title: 'Simple Drag & Drop Upload',
    description: 'Just drag your PDF into the upload area or click to browse.',
  },
  {
    icon: Scale,
    title: 'Original vs Compressed Comparison',
    description: 'See your original and compressed file sizes side by side before downloading.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure File Processing',
    description: 'Your PDF is processed by the compression service and not stored after compression completes.',
  },
  {
    icon: Download,
    title: 'Easy PDF Downloads',
    description: 'Download your optimized PDF instantly with a single click.',
  },
];

export default function Features() {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-brand-600">
            Features
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
            Everything you need to compress PDFs
          </h2>
          <p className="mt-4 text-ink-500">
            A straightforward tool built around speed, flexibility, and clarity.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-2xl border border-ink-100 bg-white p-6 shadow-soft transition-all hover:border-brand-200 hover:shadow-card"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 transition-transform group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-bold text-ink-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
