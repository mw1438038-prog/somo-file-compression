import { useState, type FormEvent } from 'react';
import { X, Loader2, Mail, Lock, User as UserIcon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

type Mode = 'login' | 'signup';

interface AuthModalProps {
  open: boolean;
  mode: Mode;
  onClose: () => void;
  onSwitchMode: (mode: Mode) => void;
}

export default function AuthModal({ open, mode, onClose, onSwitchMode }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [forgotPassword, setForgotPassword] = useState(false);

  if (!open) return null;

  const resetFields = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);
    setInfo(null);

    try {
      if (forgotPassword) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
        );
        if (resetError) throw resetError;
        setInfo("Password reset instructions have been sent to your email.");
      } else if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }

      if (!forgotPassword) {
        resetFields();
        onClose();
      } else {
        setPassword('');
        setName('');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(
        message.includes('Invalid login')
          ? 'Incorrect email or password.'
          : message.includes('already registered')
            ? 'An account with this email already exists. Please log in.'
            : message,
      );
    } finally {
      setBusy(false);
    }
  };

  const inputBase =
    'w-full rounded-xl border bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-300 transition focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 border-ink-200';
  const isSignup = mode === 'signup';
  const title = forgotPassword
    ? 'Reset your password'
    : isSignup
      ? 'Create your account'
      : 'Welcome back';
  const subtitle = forgotPassword
    ? "Enter your email and we'll send you a link to reset your password."
    : isSignup
      ? 'Sign up to start compressing PDFs for free.'
      : 'Log in to access the PDF compression tool.';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-3xl border border-ink-100 bg-white p-6 shadow-lift animate-scale-in sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-extrabold tracking-tight text-ink-900">{title}</h2>
        <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isSignup && !forgotPassword && (
            <div>
              <label htmlFor="auth-name" className="mb-1.5 block text-sm font-semibold text-ink-700">
                Name
              </label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={busy}
                  required
                  placeholder="Your name"
                  className={`${inputBase} pl-10`}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="mb-1.5 block text-sm font-semibold text-ink-700">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                required
                placeholder="you@example.com"
                className={`${inputBase} pl-10`}
              />
            </div>
          </div>

          {!forgotPassword && (
            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-sm font-semibold text-ink-700">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className={`${inputBase} pl-10`}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{error}</p>
          )}

          {info && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{info}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy && <Loader2 className="h-5 w-5 animate-spin" />}
            {busy
              ? 'Please wait...'
              : forgotPassword
                ? 'Send reset link'
                : isSignup
                  ? 'Create account'
                  : 'Log in'}
          </button>
        </form>

        <div className="mt-5 space-y-2 text-center text-sm text-ink-500">
          {!forgotPassword && !isSignup && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setInfo(null);
                setForgotPassword(true);
              }}
              className="font-medium text-ink-500 transition hover:text-brand-600"
            >
              Forgot your password?
            </button>
          )}

          {forgotPassword && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setInfo(null);
                setForgotPassword(false);
              }}
              className="font-semibold text-brand-600 transition hover:text-brand-700"
            >
              Back to login
            </button>
          )}

          {!forgotPassword && (
            <p>
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setInfo(null);
                  onSwitchMode(isSignup ? 'login' : 'signup');
                }}
                className="font-semibold text-brand-600 transition hover:text-brand-700"
              >
                {isSignup ? 'Log in' : 'Sign up'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
