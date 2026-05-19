import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../components/AuthProvider';

export default function Login() {
  const { user, signInWithGoogle } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container/50 border border-border-glass rounded-xl p-lg backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-secondary-container flex items-center justify-center shadow-[0_0_20px_rgba(107,216,203,0.3)] mb-6">
            <span className="material-symbols-outlined text-background icon-fill" style={{ fontSize: 36 }}>psychiatry</span>
          </div>
          <h1 className="text-3xl font-bold text-on-surface mb-2 tracking-tight">Welcome back</h1>
          <p className="text-on-surface-variant text-center">Sign in to continue to Velora workspace.</p>
        </div>

        <button 
          onClick={signInWithGoogle}
          className="w-full relative z-10 flex items-center justify-center gap-3 bg-surface-variant hover:bg-surface-bright text-on-surface font-medium py-3 rounded-lg border border-border-glass transition-all hover:scale-[1.02]"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>
      </div>
    </div>
  );
}
