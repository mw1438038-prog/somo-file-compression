import { UploadCloud, SlidersHorizontal, Download } from 'lucide-react';

const STEPS: {
  number: string;
  icon: typeof UploadCloud;
  title: string;
  description: string;
}[] = [
  {
    number: '01',
    icon: UploadCloud,
    title: 'Upload Your PDF',
    description: 'Select a PDF file or drag and drop it into the upload area.',
  },
  {
    number: '02',
    icon: SlidersHorizontal,
    title: 'Choose Compression',
    description: 'Select the compression level that suits your needs.',
  },
  {
    number: '03',
    icon: Download,
    title: 'Download Your PDF',
    description: 'Download your compressed PDF and compare the file size.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-nav bg-ink-50/60 py-16 sm:py-20 lg:py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-brand-600">
            How It Works
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
            Compress your PDF in three simple steps
          </h2>
          <p className="mt-4 text-ink-500">
            No complicated workflow. Just upload, choose, and download.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3 lg:gap-8">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative">
                <div className="group h-full rounded-3xl border border-ink-100 bg-white p-6 shadow-soft transition-all hover:shadow-lift sm:p-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/10 text-brand-600 transition-transform group-hover:scale-110">
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className="mt-5 block text-5xl font-extrabold text-ink-100">
                    {step.number}
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-ink-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">
                    {step.description}
                  </p>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="absolute left-full top-1/2 -translate-x-1/2 -translate-y-1/2 text-ink-200">
                    <svg className="hidden h-8 w-8 sm:block" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M5 12h14m0 0l-6-6m6 6l-6 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
