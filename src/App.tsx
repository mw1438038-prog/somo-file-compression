import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { AuthProvider, useAuth } from '@/lib/auth';
import PdfCompressor from '@/components/PdfCompressor';
import Hero from '@/sections/Hero';
import HowItWorks from '@/sections/HowItWorks';
import Features from '@/sections/Features';
import WhyChoose from '@/sections/WhyChoose';
import Pricing from '@/sections/Pricing';
import FAQ from '@/sections/FAQ';
import Contact from '@/sections/Contact';
import FinalCTA from '@/sections/FinalCTA';
import LegalPage from '@/pages/LegalPage';
import { getSitePageKey, SITE_PAGE_PATHS } from '@/lib/legalRoutes';
import {
  HOME_SEO,
  SITE_PAGE_SEO,
  updatePageSeo,
} from '@/lib/siteSeo';

type AuthMode = 'login' | 'signup';

function AppContent() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const { session } = useAuth();
  const sitePage = getSitePageKey(pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleHashNavigation = () => {
      if (window.location.pathname === '/') {
        setPathname('/');
      }
    };
    window.addEventListener('hashchange', handleHashNavigation);
    return () => window.removeEventListener('hashchange', handleHashNavigation);
  }, []);

  useEffect(() => {
    const isHome = pathname === '/' || pathname === '/index.html';
    const seo = sitePage ? SITE_PAGE_SEO[sitePage] : isHome ? HOME_SEO : null;
    const canonicalPath = sitePage
      ? SITE_PAGE_PATHS[sitePage]
      : isHome
        ? '/'
        : null;
    updatePageSeo(seo, canonicalPath);
  }, [pathname, sitePage]);

  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    setPathname(window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const requireAuth = () => {
    openAuth('signup');
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink-900">
      <Header onOpenAuth={openAuth} homePath={sitePage ? '/' : ''} />
      <main className="flex-1">
        {sitePage ? (
          <LegalPage
            page={sitePage}
            onNavigateHome={() => navigate('/')}
          />
        ) : (
          <>
          {session && (
            <section id="compress" className="scroll-mt-nav bg-brand-50/50">
              <div className="container-page py-12 sm:py-16">
                <div className="mx-auto max-w-3xl">
                  <div className="mb-6 text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
                      PDF Compressor Dashboard
                    </h1>
                    <p className="mt-2 text-ink-500">
                      Upload a PDF and choose the compression level that works for you.
                    </p>
                  </div>
                  <PdfCompressor onRequireAuth={requireAuth} />
                </div>
              </div>
            </section>
          )}
          <Hero onRequireAuth={requireAuth} showCompressor={!session} />
          <HowItWorks />
          <Features />
          <WhyChoose />
          <Pricing />
          <FAQ />
          <Contact />
          <FinalCTA />
          </>
        )}
      </main>
      <Footer onNavigate={navigate} isRoutedPage={Boolean(sitePage)} />
      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onSwitchMode={(mode) => setAuthMode(mode)}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
