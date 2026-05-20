import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logout as firebaseLogout } from '../services/firebase';
import { DEMO_AUTH_STORAGE_KEY, DEMO_USER_ID } from '../services/demo';

const demoUser = {
  uid: DEMO_USER_ID,
  email: 'demo@velora.local',
  displayName: 'Demo Account',
  photoURL: null,
  isAnonymous: false,
  emailVerified: true,
  tenantId: null,
  providerData: [{ providerId: 'demo', uid: DEMO_USER_ID, displayName: 'Demo Account', email: 'demo@velora.local', phoneNumber: null, photoURL: null }],
} as User;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(DEMO_AUTH_STORAGE_KEY) === 'true') {
      setUser(demoUser);
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInDemoAccount = async () => {
    localStorage.setItem(DEMO_AUTH_STORAGE_KEY, 'true');
    setUser(demoUser);
  };

  const logout = async () => {
    localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
    setUser(null);

    if (auth.currentUser) {
      await firebaseLogout();
    }
  };

  return { user, loading, signInWithGoogle, signInDemoAccount, logout };
}
