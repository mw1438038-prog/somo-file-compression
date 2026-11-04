import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-ink-950 px-6 py-14 text-center shadow-lift sm:px-12 sm:py-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-80px] h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="absolute bottom-[-60px] right-[5%] h-[200px] w-[200px] rounded-full bg-brand-500/10 blur-3xl" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Ready to Make Your PDFs Smaller?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-ink-300 sm:text-lg">
          Start compressing your PDF files in just a few simple steps.
        </p>
        <a
          href="#compress"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98]"
        >
          Compress PDF Now
          <ArrowRight className="h-5 w-5" />
        </a>
      </div>
    </section>
  );
}
