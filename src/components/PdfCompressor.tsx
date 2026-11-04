import { useState, type DragEvent, type ChangeEvent } from 'react';
import {
  FileDown,
  FileText,
  Loader2,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  X,
  Zap,
  Sparkles,
  Feather,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

type Level = 'extreme' | 'recommended' | 'less';

const LEVELS: {
  id: Level;
  label: string;
  description: string;
  icon: typeof Zap;
  badge?: string;
}[] = [
  { id: 'extreme', label: 'Extreme Compression', description: 'Smallest file, lower image detail.', icon: Zap },
  {
    id: 'recommended',
    label: 'Recommended',
    description: 'Balanced size and quality.',
    icon: Sparkles,
    badge: 'Popular',
  },
  { id: 'less', label: 'Less Compression', description: 'Highest quality, modest savings.', icon: Feather },
];

const MAX_BYTES = 6 * 1024 * 1024;
const COMPRESSION_TIMEOUT_MS = 120_000;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

interface Result {
  url: string;
  originalSize: number;
  compressedSize: number;
  applied: boolean;
  fileName: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function PdfCompressor({ onRequireAuth }: { onRequireAuth: () => void }) {
  const { session } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<Level>('recommended');
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const chooseFile = (candidate: File | undefined) => {
    if (!session) {
      onRequireAuth();
      return;
    }
    setResult(null);
    setError(null);
    if (!candidate) return;
    const isPdf =
      candidate.type === 'application/pdf' ||
      candidate.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setFile(null);
      setError('Please choose a PDF file.');
      return;
    }
    if (candidate.size > MAX_BYTES) {
      setFile(null);
      setError('This file is larger than the 6 MB limit.');
      return;
    }
    setFile(candidate);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) =>
    chooseFile(e.target.files?.[0]);

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    chooseFile(e.dataTransfer.files?.[0]);
  };

  const compress = async () => {
    if (!file) return;
    if (!session) {
      onRequireAuth();
      return;
    }
    if (!SUPABASE_URL) {
      setError('The compression service is not configured. Please try again later.');
      return;
    }
    if (result) URL.revokeObjectURL(result.url);
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/compress-pdf?level=${level}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/pdf',
          },
          body: file,
          signal: AbortSignal.timeout(COMPRESSION_TIMEOUT_MS),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? `Compression failed (${response.status}).`);
      }
      const blob = await response.blob();
      const originalSize = Number(response.headers.get('X-Original-Size') ?? file.size);
      const compressedSize = Number(response.headers.get('X-Compressed-Size') ?? blob.size);
      const applied = response.headers.get('X-Compression-Applied') === 'true';
      setResult({
        url: URL.createObjectURL(blob),
        originalSize,
        compressedSize,
        applied,
        fileName: file.name.replace(/\.pdf$/i, '') + '-compressed.pdf',
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'TimeoutError') {
        setError(
          'Compression took too long. Try a smaller file or a lighter compression level.',
        );
      } else if (err instanceof TypeError) {
        setError('Network error. Check your connection and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const saved =
    result && result.originalSize > 0
      ? Math.max(0, Math.round((1 - result.compressedSize / result.originalSize) * 100))
      : 0;

  return (
    <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-lift sm:p-8">
      {!session ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50/40 px-6 py-14 text-center sm:py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600/10 text-brand-600">
            <Lock className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-ink-900">Sign in to compress PDFs</h3>
          <p className="mt-1.5 max-w-sm text-sm text-ink-500">
            Create a free account or log in to start compressing your PDF files.
          </p>
          <button
            type="button"
            onClick={onRequireAuth}
            className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98]"
          >
            <FileText className="h-5 w-5" />
            Get Started — It's Free
          </button>
        </div>
      ) : (
        <>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all sm:py-14 ${
          dragging
            ? 'border-brand-600 bg-brand-50 scale-[1.01]'
            : 'border-ink-200 bg-ink-50/40 hover:border-brand-400 hover:bg-brand-50/30'
        }`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600/10 text-brand-600 transition-transform group-hover:scale-110">
          <UploadCloud className="h-8 w-8" />
        </div>
        <span className="mt-4 text-base font-semibold text-ink-900 sm:text-lg">
          {file ? file.name : 'Drop your PDF here or click to choose'}
        </span>
        <span className="mt-1 text-sm text-ink-400">
          {file ? formatBytes(file.size) : 'PDF files up to 6 MB'}
        </span>
        {file && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              setFile(null);
              setResult(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setFile(null);
                setResult(null);
              }
            }}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-ink-100 text-ink-500 transition hover:bg-ink-200 hover:text-ink-700"
          >
            <X className="h-4 w-4" />
          </span>
        )}
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={onInputChange}
        />
      </label>

      {file && (
        <section className="mt-6 space-y-5 animate-fade-up">
          <div>
            <p className="mb-3 text-sm font-semibold text-ink-700">Choose compression level</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {LEVELS.map((opt) => {
                const Icon = opt.icon;
                const selected = level === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLevel(opt.id)}
                    className={`relative rounded-2xl border p-4 text-left transition-all ${
                      selected
                        ? 'border-brand-600 bg-brand-600 text-white shadow-md'
                        : 'border-ink-200 bg-white text-ink-900 hover:border-brand-300 hover:shadow-soft'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${selected ? 'text-white' : 'text-brand-600'}`} />
                      <span className="font-semibold">{opt.label}</span>
                    </div>
                    <span
                      className={`mt-1.5 block text-sm ${
                        selected ? 'text-brand-50' : 'text-ink-400'
                      }`}
                    >
                      {opt.description}
                    </span>
                    {opt.badge && (
                      <span
                        className={`absolute -top-2 right-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          selected ? 'bg-white text-brand-600' : 'bg-brand-600 text-white'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={compress}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
            {busy ? 'Compressing...' : 'Compress PDF'}
          </button>
        </section>
      )}

      {error && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-brand-800 animate-fade-in"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {result && (
        <section className="mt-6 rounded-2xl border border-ink-100 bg-ink-50/50 p-6 animate-scale-in">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">
              {result.applied ? `You saved ${saved}%` : 'This PDF was already optimized'}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl bg-white p-3 shadow-soft">
              <p className="text-ink-400">Original</p>
              <p className="text-lg font-bold text-ink-900">
                {formatBytes(result.originalSize)}
              </p>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-soft">
              <p className="text-ink-400">Compressed</p>
              <p className="text-lg font-bold text-brand-600">
                {formatBytes(result.compressedSize)}
              </p>
            </div>
          </div>
          <a
            href={result.url}
            download={result.fileName}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-ink-900 px-6 py-3.5 font-semibold text-white transition hover:bg-ink-800 active:scale-[0.99]"
          >
            <FileDown className="h-5 w-5" />
            Download compressed PDF
          </a>
        </section>
      )}
        </>
      )}
    </div>
  );
}
