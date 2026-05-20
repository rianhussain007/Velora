import { useEffect, useMemo, useState } from 'react';
import { Globe2, Loader2, LogIn, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../components/AuthProvider';

const messages = {
  en: {
    locale: 'English',
    eyebrow: 'Flow State OS',
    title: 'Welcome back',
    subtitle: 'Sign in to continue to your Velora workspace.',
    google: 'Continue with Google',
    demo: 'Use demo account',
    demoHint: 'Explore Velora with a ready-to-use demo session.',
    language: 'Language',
    signingIn: 'Signing in...',
    error: 'Sign in failed. Check your Firebase auth providers and try again.'
  },
  hi: {
    locale: 'हिन्दी',
    eyebrow: 'फ्लो स्टेट OS',
    title: 'वापसी पर स्वागत है',
    subtitle: 'अपने Velora कार्यक्षेत्र में आगे बढ़ने के लिए साइन इन करें।',
    google: 'Google से जारी रखें',
    demo: 'डेमो खाता इस्तेमाल करें',
    demoHint: 'तैयार डेमो सत्र के साथ Velora देखें।',
    language: 'भाषा',
    signingIn: 'साइन इन हो रहा है...',
    error: 'साइन इन नहीं हो पाया। Firebase auth providers जांचें और फिर कोशिश करें।'
  },
  es: {
    locale: 'Español',
    eyebrow: 'Flow State OS',
    title: 'Te damos la bienvenida',
    subtitle: 'Inicia sesión para continuar en tu espacio de Velora.',
    google: 'Continuar con Google',
    demo: 'Usar cuenta demo',
    demoHint: 'Explora Velora con una sesión de demostración lista.',
    language: 'Idioma',
    signingIn: 'Iniciando sesión...',
    error: 'No se pudo iniciar sesión. Revisa los proveedores de Firebase Auth e inténtalo otra vez.'
  }
};

type Locale = keyof typeof messages;

const getInitialLocale = (): Locale => {
  const browserLocale = navigator.language.toLowerCase();
  if (browserLocale.startsWith('hi')) return 'hi';
  if (browserLocale.startsWith('es')) return 'es';
  return 'en';
};

export default function Login() {
  const { user, signInWithGoogle, signInDemoAccount } = useAuthContext();
  const navigate = useNavigate();
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const [pendingAction, setPendingAction] = useState<'google' | 'demo' | null>(null);
  const [error, setError] = useState('');
  const t = useMemo(() => messages[locale], [locale]);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSignIn = async (method: 'google' | 'demo') => {
    setPendingAction(method);
    setError('');

    try {
      if (method === 'google') {
        await signInWithGoogle();
      } else {
        await signInDemoAccount();
      }
    } catch {
      setError(t.error);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[960px] grid overflow-hidden rounded-xl border border-border-glass bg-surface-container/80 shadow-2xl backdrop-blur-xl md:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden min-h-[560px] flex-col justify-between bg-surface p-8 md:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-on-primary shadow-[0_0_20px_rgba(107,216,203,0.24)]">
              <Sparkles size={22} />
            </div>
            <div>
              <h1 className="text-[24px] font-bold leading-7 text-primary">Velora</h1>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Clarity. Focus. Execution.</p>
            </div>
          </div>

          <div className="max-w-sm">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-primary">{t.eyebrow}</p>
            <h2 className="text-[40px] font-bold leading-tight text-on-surface">Plan today. Protect your rhythm.</h2>
            <p className="mt-4 text-[15px] leading-7 text-on-surface-variant">
              Tasks, habits, focus sessions, and AI insights stay tied to the account you choose here.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-[12px] text-on-surface-variant">
            {['Tasks', 'Habits', 'Insights'].map((item) => (
              <div key={item} className="rounded-lg border border-border-glass bg-surface-container px-3 py-3 text-center font-semibold text-on-surface">
                {item}
              </div>
            ))}
          </div>
        </section>

        <main className="p-6 sm:p-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-on-primary">
                <Sparkles size={20} />
              </div>
              <span className="text-[22px] font-bold text-primary">Velora</span>
            </div>

            <label className="ml-auto flex items-center gap-2 rounded-lg border border-border-glass bg-surface px-3 py-2 text-[13px] text-on-surface-variant">
              <Globe2 size={16} />
              <span className="sr-only">{t.language}</span>
              <select
                value={locale}
                onChange={(event) => setLocale(event.target.value as Locale)}
                className="bg-transparent text-on-surface outline-none"
                aria-label={t.language}
              >
                {Object.entries(messages).map(([key, value]) => (
                  <option key={key} value={key} className="bg-surface text-on-surface">
                    {value.locale}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mb-8">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-primary">{t.eyebrow}</p>
            <h1 className="mb-3 text-[32px] font-bold leading-tight text-on-surface">{t.title}</h1>
            <p className="text-[15px] leading-6 text-on-surface-variant">{t.subtitle}</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => handleSignIn('google')}
              disabled={pendingAction !== null}
              className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-border-glass bg-surface-variant px-4 py-3 font-semibold text-on-surface transition-all hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingAction === 'google' ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="h-5 w-5" />
              )}
              <span>{pendingAction === 'google' ? t.signingIn : t.google}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSignIn('demo')}
              disabled={pendingAction !== null}
              className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-primary px-4 py-3 font-bold text-on-primary transition-all hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingAction === 'demo' ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
              <span>{pendingAction === 'demo' ? t.signingIn : t.demo}</span>
            </button>
          </div>

          <p className="mt-4 rounded-lg border border-border-glass bg-surface/70 px-4 py-3 text-[13px] leading-5 text-on-surface-variant">
            {t.demoHint}
          </p>

          {error && (
            <p role="alert" className="mt-4 rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-[13px] leading-5 text-error">
              {error}
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
