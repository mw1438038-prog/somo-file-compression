import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS: { question: string; answer: string }[] = [
  {
    question: 'How do I compress a PDF?',
    answer:
      'Drag your PDF into the upload area or click it to browse and select a file (up to 6 MB). Choose one of the three compression levels, then click Compress PDF. When processing is done, click Download compressed PDF to save the result.',
  },
  {
    question: 'Which compression level should I choose?',
    answer:
      'Recommended (/ebook) gives a good balance of file size and quality for most documents. Extreme (/screen) produces the smallest file but lowers image detail, so it suits files where smaller size matters more than visual fidelity. Less (/printer) keeps higher quality with more modest size savings.',
  },
  {
    question: 'Is there a file size limit?',
    answer:
      'Yes. The upload limit is 6 MB per PDF. If your file is larger you will see a message letting you know it exceeds the limit. There is also a rate limit on how many compressions you can run within a rolling time window.',
  },
  {
    question: 'Can I download my compressed PDF?',
    answer:
      'Yes. After compression finishes, a result panel shows your original and compressed file sizes side by side, along with a Download compressed PDF button. If the file was already optimized and no further reduction was possible, you can still download it.',
  },
  {
    question: 'Does compression affect PDF quality?',
    answer:
      'Yes, it can. Compression uses Ghostscript to resample and recompress images and embedded content, which reduces file size at the cost of some visual quality. Extreme lowers resolution the most, Recommended balances size and clarity, and Less preserves more detail with smaller savings. The page count stays the same.',
  },
];

function FaqItem({ item }: { item: { question: string; answer: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-ink-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-base font-semibold text-ink-900">{item.question}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-brand-600 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="pb-5 text-sm leading-relaxed text-ink-500">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  return (
    <section id="faq" className="scroll-mt-nav py-16 sm:py-20 lg:py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-brand-600">
            FAQ
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-ink-500">
            Everything you need to know about compressing PDFs with Somo.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-ink-100 bg-white px-6 shadow-soft sm:px-8">
          {FAQS.map((item) => (
            <FaqItem key={item.question} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
