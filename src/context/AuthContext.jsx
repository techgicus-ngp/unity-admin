import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as auth from '@/services/authService';
import { isAdmin } from '@/models/user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      await auth.seedDefaultUsers().catch((e) => console.warn('Seeding skipped:', e));
      const restored = await auth.loadSession();
      if (alive) {
        setUser(restored);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const login = useCallback(async (email, password) => {
    const u = await auth.signIn(email, password);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, isAdmin: isAdmin(user) }),
    [user, loading, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
