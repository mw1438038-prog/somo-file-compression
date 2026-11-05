import { useState } from 'react';
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

type AuthMode = 'login' | 'signup';

function AppContent() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const { session } = useAuth();

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const requireAuth = () => {
    openAuth('signup');
  };

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-white text-ink-900">
        <Header onOpenAuth={openAuth} />
        <main className="flex-1">
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
        </main>
        <Footer />
        <AuthModal
          open={authOpen}
          mode={authMode}
          onClose={() => setAuthOpen(false)}
          onSwitchMode={(mode) => setAuthMode(mode)}
        />
      </div>
    </AuthProvider>
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
