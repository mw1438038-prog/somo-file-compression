import { ArrowRight, Play } from 'lucide-react';
import PdfCompressor from '@/components/PdfCompressor';

export default function Hero({ onRequireAuth }: { onRequireAuth: () => void }) {
  return (
    <section id="home" className="relative overflow-hidden scroll-mt-nav">
      {/* Decorative background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-white to-white" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[500px] overflow-hidden">
        <div className="absolute left-1/2 top-[-100px] h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="absolute right-[10%] top-[-50px] h-[300px] w-[300px] rounded-full bg-brand-100/40 blur-3xl" />
      </div>

      <div className="container-page py-16 sm:py-20 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
              <span className="flex h-2 w-2 rounded-full bg-brand-600" />
              100% free PDF compression
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-ink-900 sm:text-5xl lg:text-[3.25rem]">
              Compress PDF Files{' '}
              <span className="text-brand-600">Quickly and Easily</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-500 sm:text-lg lg:mx-0">
              Reduce your PDF file size with flexible compression options. Upload your PDF,
              choose your preferred compression level, and download your optimized document.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <a
                href="#compress"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98] sm:w-auto"
              >
                Compress PDF Now
                <ArrowRight className="h-5 w-5" />
              </a>
              <a
                href="#how-it-works"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-6 py-3.5 font-semibold text-ink-700 transition hover:border-ink-300 hover:bg-ink-50 active:scale-[0.98] sm:w-auto"
              >
                <Play className="h-4 w-4 text-brand-600" />
                How It Works
              </a>
            </div>
          </div>

          <div id="compress" className="scroll-mt-nav">
            <PdfCompressor onRequireAuth={onRequireAuth} />
          </div>
        </div>
      </div>
    </section>
  );
}
