import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { AuthProvider } from '@/lib/auth';
import Hero from '@/sections/Hero';
import HowItWorks from '@/sections/HowItWorks';
import Features from '@/sections/Features';
import WhyChoose from '@/sections/WhyChoose';
import Pricing from '@/sections/Pricing';
import FAQ from '@/sections/FAQ';
import Contact from '@/sections/Contact';
import FinalCTA from '@/sections/FinalCTA';

type AuthMode = 'login' | 'signup';

function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

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
          <Hero onRequireAuth={requireAuth} />
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

export default App;
