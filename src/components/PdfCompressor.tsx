
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
import { supabaseKey, supabaseUrl } from '@/lib/supabaseClient';

type Level = 'extreme' | 'recommended' | 'less';

const LEVELS: {
  id: Level;
  label: string;
  description: string;
  icon: typeof Zap;
  badge?: string;
}[] = [
  {
    id: 'extreme',
    label: 'Extreme Compression',
    description: 'Smallest file, lower image detail.',
    icon: Zap,
  },
  {
    id: 'recommended',
    label: 'Recommended',
    description: 'Balanced size and quality.',
    icon: Sparkles,
    badge: 'Popular',
  },
  {
    id: 'less',
    label: 'Less Compression',
    description: 'Highest quality, modest savings.',
    icon: Feather,
  },
];

const MAX_BYTES = 10 * 1024 * 1024;
const COMPRESSION_TIMEOUT_MS = 140_000;

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

export default function PdfCompressor({
  onRequireAuth,
}: {
  onRequireAuth: () => void;
}) {
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

    if (result) {
      URL.revokeObjectURL(result.url);
    }

    setResult(null);
    setError(null);

    if (!candidate) return;

    if (candidate.size > MAX_BYTES) {
      setFile(null);
      setError(
        'Your PDF is too large. Please upload a PDF smaller than 10 MB.',
      );
      return;
    }

    const isPdf =
      candidate.type === 'application/pdf' ||
      candidate.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setFile(null);
      setError('Please choose a valid PDF file.');
      return;
    }

    setFile(candidate);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    chooseFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    chooseFile(e.dataTransfer.files?.[0]);
  };

  const compress = async () => {
    if (!file || busy) return;

    if (!session) {
      onRequireAuth();
      return;
    }

    if (result) {
      URL.revokeObjectURL(result.url);
    }

    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/compress-pdf?level=${level}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: supabaseKey,
            'Content-Type': 'application/pdf',
          },
          body: file,
          signal: AbortSignal.timeout(COMPRESSION_TIMEOUT_MS),
        },
      );

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);

        const code =
          typeof body === 'object' &&
          body !== null &&
          'code' in body
            ? body.code
            : undefined;

        let message =
          'We could not compress this PDF. Please try another file.';

        if (response.status === 413) {
          message =
            'Your PDF is too large. Please upload a PDF smaller than 10 MB.';
        } else if (response.status === 415) {
          message =
            'This file is not a valid PDF. Please choose a valid PDF file.';
        } else if (
          response.status === 422 &&
          code === 'password_protected_pdf'
        ) {
          message =
            'This PDF is password-protected. Please remove its password and try again.';
        } else if (response.status === 422) {
          message =
            'This PDF appears to be corrupted or unreadable. Please try another PDF.';
        } else if (response.status === 546) {
          message =
            'This PDF could not be compressed because it reached the processing limit. Please try another PDF or a lighter compression level.';
        } else if (response.status === 401) {
          message =
            'Your session has expired. Please log in again and retry.';
        } else if (response.status === 429) {
          message =
            'You have reached the compression limit. Please wait a while and try again.';
        } else if (response.status === 503) {
          message =
            'Compression is temporarily unavailable. Please try again later.';
        } else if (response.status >= 500) {
          message =
            'A server error occurred while compressing your PDF. Please try again later.';
        }

        setError(message);
        return;
      }

      const blob = await response.blob();

      if (blob.size === 0 || blob.type !== 'application/pdf') {
        setError(
          'The compression service returned an invalid PDF. Please try again.',
        );
        return;
      }

      const originalSize = Number(
        response.headers.get('X-Original-Size') ?? file.size,
      );

      const compressedSize = Number(
        response.headers.get('X-Compressed-Size') ?? blob.size,
      );

      const applied =
        response.headers.get('X-Compression-Applied') === 'true';

      setResult({
        url: URL.createObjectURL(blob),
        originalSize,
        compressedSize,
        applied,
        fileName: file.name.replace(/\.pdf$/i, '') + '-compressed.pdf',
      });
    } catch (err) {
      if (
        err instanceof DOMException &&
        (err.name === 'TimeoutError' || err.name === 'AbortError')
      ) {
        setError(
          'Compression took too long. Please try a smaller PDF or a lighter compression level.',
        );
      } else if (err instanceof TypeError) {
        setError(
          'Connection failed. Please check your internet and try again.',
        );
      } else {
        setError(
          'The compression service encountered an error. Please try again later.',
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const saved =
    result && result.originalSize > 0
      ? Math.max(
          0,
          Math.round(
            (1 - result.compressedSize / result.originalSize) * 100,
          ),
        )
      : 0;

  return (
    <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-lift sm:p-8">
      {!session ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50/40 px-6 py-14 text-center sm:py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600/10 text-brand-600">
            <Lock className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-ink-900">
            Sign in to compress PDFs
          </h3>
          <p className="mt-1.5 max-w-sm text-sm text-ink-500">
            Create a free account or log in to start compressing your PDF files.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-ink-900">
              Compress your PDF
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Upload a PDF up to 10 MB and choose your compression level.
            </p>
          </div>

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
              dragging
                ? 'border-brand-500 bg-brand-50'
                : 'border-ink-200 bg-ink-50/40 hover:border-brand-400'
            }`}
          >
            <UploadCloud className="h-10 w-10 text-brand-600" />
            <span className="mt-3 font-semibold text-ink-900">
              {file ? file.name : 'Choose a PDF or drag it here'}
            </span>
            <span className="mt-1 text-sm text-ink-500">
              Maximum file size: 10 MB
            </span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={onInputChange}
              disabled={busy}
            />
          </label>

          {file && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-ink-50 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-6 w-6 shrink-0 text-brand-600" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {file.name}
                  </p>
                  <p className="text-xs text-ink-500">
                    {formatBytes(file.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setError(null);
                  if (result) URL.revokeObjectURL(result.url);
                  setResult(null);
                }}
                disabled={busy}
                className="rounded-lg p-2 text-ink-500 hover:bg-white hover:text-red-600"
                aria-label="Remove selected PDF"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          <div className="mt-6">
            <h3 className="mb-3 text-sm font-bold text-ink-900">
              Compression level
            </h3>

            <div className="grid gap-3 sm:grid-cols-3">
              {LEVELS.map((item) => {
                const Icon = item.icon;
                const selected = level === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLevel(item.id)}
                    disabled={busy}
                    className={`relative rounded-xl border p-4 text-left transition ${
                      selected
                        ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                        : 'border-ink-200 hover:border-brand-300'
                    }`}
                  >
                    {item.badge && (
                      <span className="absolute right-2 top-2 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                    <Icon className="mb-2 h-5 w-5 text-brand-600" />
                    <p className="text-sm font-bold text-ink-900">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={compress}
            disabled={!file || busy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Compressing PDF...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Compress PDF
              </>
            )}
          </button>

          {result && (
            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-6 w-6" />
                <h3 className="font-bold">PDF compression complete</h3>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-ink-500">Original size</p>
                  <p className="mt-1 font-bold text-ink-900">
                    {formatBytes(result.originalSize)}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-ink-500">Compressed size</p>
                  <p className="mt-1 font-bold text-ink-900">
                    {formatBytes(result.compressedSize)}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm text-green-800">
                {result.applied
                  ? `Your PDF size was reduced by ${saved}%.`
                  : 'This PDF was already optimized. No further size reduction was possible.'}
              </p>

              <a
                href={result.url}
                download={result.fileName}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
              >
                <FileDown className="h-5 w-5" />
                Download Compressed PDF
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
