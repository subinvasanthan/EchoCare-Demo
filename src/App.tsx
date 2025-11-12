import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Header from './components/Header';
import Hero from './components/Hero';
import VideoSection from './components/VideoSection';
import Benefits from './components/Benefits';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import AuthCallback from './components/AuthCallback';


function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'auth-callback' | 'signin' | 'signup' | 'forgot' | 'reset-password'>('landing');
  const [user, setUser] = useState<any>(null);

  // theme init
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved) setDarkMode(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // auth + URL handling
  useEffect(() => {
    const applyRoute = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const path = window.location.pathname;

      setUser(session?.user ?? null);

      if (path === '/dashboard') setCurrentView(session ? 'dashboard' : 'landing');
      else if (path === '/auth/callback') setCurrentView('auth-callback');
      else if (path === '/signin') setCurrentView('signin');
      else if (path === '/signup') setCurrentView('signup');
      else if (path === '/forgot') setCurrentView('forgot');
      else if (path === '/reset-password') setCurrentView('reset-password');
      else setCurrentView('landing'); // stay on landing even if signed in (so ProfileSection can show)
    };

    applyRoute();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      // stay on current page; if you're on /signin and sign in succeeds, we'll push to /
      if (session && window.location.pathname === '/signin') {
        window.history.pushState({}, '', '/');
        setCurrentView('landing');
      }
      if (!session && window.location.pathname === '/dashboard') {
        window.history.pushState({}, '', '/');
        setCurrentView('landing');
      }
      if (event === 'PASSWORD_RECOVERY') {
        window.history.pushState({}, '', '/reset-password');
        setCurrentView('reset-password');
      }
    });

    const onPop = () => {
      const path = window.location.pathname;
      if (path === '/dashboard') setCurrentView(user ? 'dashboard' : 'landing');
      else if (path === '/auth/callback') setCurrentView('auth-callback');
      else if (path === '/signin') setCurrentView('signin');
      else if (path === '/signup') setCurrentView('signup');
      else if (path === '/forgot') setCurrentView('forgot');
      else if (path === '/reset-password') setCurrentView('reset-password');
      else setCurrentView('landing');
    };
    window.addEventListener('popstate', onPop);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('popstate', onPop);
    };
  }, [user]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // --- Views ---
  if (currentView === 'auth-callback') {
    return <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300"><AuthCallback /></div>;
  }
  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <Dashboard darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      </div>
    );
  }

  // Simple inline Sign In/Up pages (if you already have components for these, you can render them here instead)
  if (currentView === 'signin') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} user={user} />
        <div className="max-w-lg mx-auto px-4 py-10">
          <SignInCard />
        </div>
      </div>
    );
  }
  if (currentView === 'signup') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} user={user} />
        <div className="max-w-lg mx-auto px-4 py-10">
          <SignUpCard />
        </div>
      </div>
    );
  }
  if (currentView === 'forgot') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} user={user} />
        <div className="max-w-lg mx-auto px-4 py-10">
          <ForgotPasswordCard />
        </div>
      </div>
    );
  }
  if (currentView === 'reset-password') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} user={user} />
        <div className="max-w-lg mx-auto px-4 py-10">
          <ResetPasswordCard />
        </div>
      </div>
    );
  }

  // LANDING — shows ProfileSection when signed in
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} user={user} />
     
      <main>
        <Hero />
        <VideoSection />
        <Benefits />
        <HowItWorks />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

/** Inline SignIn/SignUp forms (use these if you don't already have pages) **/
function SignInCard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) alert(error.message);
    else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };
  return (
    <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 space-y-4">
      <h2 className="text-2xl font-bold text-center mb-2">Login to EchoCare</h2>
      <input className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700"
        placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} />
      <input type="password" className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700"
        placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button type="submit" disabled={busy}
        className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium">
        {busy ? 'Logging in…' : 'Login'}
      </button>
      <button
        type="button"
        onClick={() => {
          window.history.pushState({}, '', '/forgot');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }}
        className="w-full text-sm text-teal-600 hover:text-teal-700 underline"
      >
        Forgot your password?
      </button>
    </form>
  );
}

function SignUpCard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name // ✅ This stores the name in user_metadata
        }
      }
    });

    setBusy(false);

    if (error) alert(error.message);
    else {
      alert('Check your email to confirm, then sign in.');
      window.history.pushState({}, '', '/signin');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 space-y-4">
      <h2 className="text-2xl font-bold text-center mb-2">Create Your EchoCare Account</h2>
      <input
        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700"
        placeholder="Full name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <input
        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700"
        placeholder="your@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700"
        placeholder="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button
        type="submit"
        disabled={busy}
        className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium"
      >
        {busy ? 'Signing up…' : 'Sign Up'}
      </button>
    </form>
  );
}

function ForgotPasswordCard() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) alert(error.message);
    else alert('Check your email for a password reset link.');
  };

  return (
    <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 space-y-4">
      <h2 className="text-2xl font-bold text-center mb-2">Forgot your password?</h2>
      <input
        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700"
        placeholder="your@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <button
        type="submit"
        disabled={busy}
        className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium"
      >
        {busy ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  );
}

function ResetPasswordCard() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      alert('Password should be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      alert('Passwords do not match.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) alert(error.message);
    else {
      alert('Password updated. Please sign in with your new password later.');
      window.history.pushState({}, '', '/signin');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 space-y-4">
      <h2 className="text-2xl font-bold text-center mb-2">Set a new password</h2>
      <input
        type="password"
        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700"
        placeholder="New password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <input
        type="password"
        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700"
        placeholder="Confirm new password"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
      />
      <button
        type="submit"
        disabled={busy}
        className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium"
      >
        {busy ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}

export default App;
