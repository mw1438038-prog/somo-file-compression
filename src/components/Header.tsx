import { useEffect, useState } from 'react';
import { FileText, Menu, X, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/auth';

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '#home' },
  { label: 'Compress PDF', href: '#compress' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
];

export default function Header({ onOpenAuth }: { onOpenAuth: (mode: 'login' | 'signup') => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('#home');
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.querySelector(item.href)).filter(
      Boolean,
    ) as HTMLElement[];

    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(`#${entry.target.id}`);
          }
        });
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setSignOutError('Unable to log out. Please check your connection and try again.');
        return;
      }
      setOpen(false);
    } catch {
      setSignOutError('Unable to log out. Please check your connection and try again.');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-ink-100 bg-white/90 backdrop-blur-md shadow-soft'
          : 'border-b border-transparent bg-white/70 backdrop-blur-sm'
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between sm:h-18">
        <a
          href="#home"
          className="flex items-center gap-2.5"
          onClick={() => setActive('#home')}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <FileText className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-base font-extrabold tracking-tight text-ink-900">Somo</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">
              File Compression
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'text-brand-600'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                {item.label}
                <span
                  className={`absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand-600 transition-all duration-300 ${
                    isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                  }`}
                />
              </a>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              {signOutError && <p role="alert" className="text-xs text-brand-700">{signOutError}</p>}
              <span className="text-sm font-medium text-ink-600">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-70"
              >
                <LogOut className="h-4 w-4" />
                {signingOut ? 'Logging out...' : 'Log out'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:text-brand-600"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-95"
              >
                Sign up free
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-700 transition hover:bg-ink-100 lg:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div
        className={`lg:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        } transition-opacity duration-300`}
      >
        <div
          className="fixed inset-0 top-16 z-40 bg-ink-950/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        <nav className="absolute inset-x-0 top-full z-50 border-b border-ink-100 bg-white shadow-lift">
          <div className="container-page flex flex-col gap-1 py-4">
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center rounded-xl px-4 py-3 text-base font-semibold transition ${
                    isActive
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-ink-700 hover:bg-ink-50'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
            <div className="mt-2 border-t border-ink-100 pt-3">
              {user ? (
                <div className="flex flex-col gap-1">
                  {signOutError && <p role="alert" className="px-4 text-xs text-brand-700">{signOutError}</p>}
                  <span className="px-4 py-2 text-sm text-ink-500">{user.email}</span>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="flex items-center gap-2 rounded-xl px-4 py-3 text-base font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-70"
                  >
                    <LogOut className="h-5 w-5" />
                    {signingOut ? 'Logging out...' : 'Log out'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onOpenAuth('login');
                    }}
                    className="flex items-center justify-center rounded-xl border border-ink-200 px-5 py-3 text-base font-semibold text-ink-700 transition hover:bg-ink-50"
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onOpenAuth('signup');
                    }}
                    className="flex items-center justify-center rounded-xl bg-brand-600 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700"
                  >
                    Sign up free
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
