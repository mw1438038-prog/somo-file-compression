import { useState, useCallback, type FormEvent, type ChangeEvent } from 'react';
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  MessageSquare,
  User as UserIcon,
  Tag,
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const CONTACT_TIMEOUT_MS = 30_000;

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const EMPTY: ContactFormData = { name: '', email: '', subject: '', message: '', website: '' };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INPUT_BASE =
  'w-full rounded-xl border bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-300 transition focus:outline-none focus:ring-2 focus:ring-brand-500/30';
const BORDER_OK = 'border-ink-200 focus:border-brand-500';
const BORDER_BAD = 'border-brand-400 focus:border-brand-500';

export default function Contact() {
  const [data, setData] = useState<ContactFormData>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const update = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const key = name as keyof ContactFormData;
    setData((prev) => (prev[key] === value ? prev : { ...prev, [name]: value }));
    setErrors((prev) =>
      prev[name as keyof FieldErrors] ? { ...prev, [name]: undefined } : prev,
    );
    setServerError((prev) => (prev === null ? prev : null));
    setSuccess((prev) => (prev ? false : prev));
  }, []);

  const validate = (): boolean => {
    const next: FieldErrors = {};
    const name = data.name.trim();
    const email = data.email.trim();
    const subject = data.subject.trim();
    const message = data.message.trim();

    if (name.length < 1) next.name = 'Please enter your name.';
    else if (name.length > 100) next.name = 'Name must be 100 characters or fewer.';

    if (email.length < 1) next.email = 'Please enter your email address.';
    else if (!EMAIL_RE.test(email)) next.email = 'Please enter a valid email address.';
    else if (email.length > 254) next.email = 'Email must be 254 characters or fewer.';

    if (subject.length < 3) next.subject = 'Subject must be at least 3 characters.';
    else if (subject.length > 200) next.subject = 'Subject must be 200 characters or fewer.';

    if (message.length < 10) next.message = 'Message must be at least 10 characters.';
    else if (message.length > 5000) next.message = 'Message must be 5000 characters or fewer.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;

    // Honeypot: if the hidden field is filled, silently ignore (bot trap).
    if (data.website.trim() !== '') {
      setSuccess(true);
      setData(EMPTY);
      return;
    }

    if (!validate()) return;

    setBusy(true);
    setServerError(null);
    setSuccess(false);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/contact`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          subject: data.subject.trim(),
          message: data.message.trim(),
          website: data.website,
        }),
        signal: AbortSignal.timeout(CONTACT_TIMEOUT_MS),
      });

      const body = await response.json().catch(() => null);

      if (response.status === 429) {
        setServerError(
          body?.error ??
            'You have sent too many messages. Please try again later.',
        );
        return;
      }

      if (response.status === 422 && body?.fields) {
        setErrors(body.fields as FieldErrors);
        return;
      }

      if (!response.ok) {
        setServerError(
          body?.error ??
            'We could not send your message right now. Please try again in a moment.',
        );
        return;
      }

      setSuccess(true);
      setData(EMPTY);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'TimeoutError') {
        setServerError('The request took too long. Please try again.');
      } else if (err instanceof TypeError) {
        setServerError('Network error. Check your connection and try again.');
      } else {
        setServerError(
          'We could not send your message right now. Please try again in a moment.',
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="contact" className="scroll-mt-nav bg-ink-50/60 py-16 sm:py-20 lg:py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-brand-600">
            Contact Us
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
            Get in touch with us
          </h2>
          <p className="mt-4 text-ink-500">
            Have a question or need help? Send us a message and we'll get back to you.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft sm:p-8"
          >
            {/* Honeypot — visually hidden, real users never see it */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="website">Website (leave empty)</label>
              <input
                id="website"
                name="website"
                type="text"
                value={data.website}
                onChange={update}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-ink-700">
                  Name
                </label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={data.name}
                    onChange={update}
                    disabled={busy}
                    placeholder="Your full name"
                    className={`${INPUT_BASE} pl-10 ${errors.name ? BORDER_BAD : BORDER_OK}`}
                    aria-invalid={!!errors.name}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1.5 text-xs text-brand-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={data.email}
                    onChange={update}
                    disabled={busy}
                    placeholder="you@example.com"
                    className={`${INPUT_BASE} pl-10 ${errors.email ? BORDER_BAD : BORDER_OK}`}
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-brand-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="subject" className="mb-1.5 block text-sm font-semibold text-ink-700">
                Subject
              </label>
              <div className="relative">
                <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={data.subject}
                  onChange={update}
                  disabled={busy}
                  placeholder="What is this about?"
                  className={`${INPUT_BASE} pl-10 ${errors.subject ? BORDER_BAD : BORDER_OK}`}
                  aria-invalid={!!errors.subject}
                />
              </div>
              {errors.subject && (
                <p className="mt-1.5 text-xs text-brand-600">{errors.subject}</p>
              )}
            </div>

            <div className="mt-5">
              <label htmlFor="message" className="mb-1.5 block text-sm font-semibold text-ink-700">
                Message
              </label>
              <div className="relative">
                <MessageSquare className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-ink-400" />
                <textarea
                  id="message"
                  name="message"
                  value={data.message}
                  onChange={update}
                  disabled={busy}
                  placeholder="Write your message here (at least 10 characters)..."
                  rows={5}
                  className={`${INPUT_BASE} resize-y pl-10 ${errors.message ? BORDER_BAD : BORDER_OK}`}
                  aria-invalid={!!errors.message}
                />
              </div>
              {errors.message && (
                <p className="mt-1.5 text-xs text-brand-600">{errors.message}</p>
              )}
            </div>

            {success && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800 animate-fade-in"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">
                  Your message has been sent successfully. We'll get back to you soon.
                </p>
              </div>
            )}

            {serverError && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-brand-800 animate-fade-in"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">{serverError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              {busy ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
