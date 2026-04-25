import { createContext, useContext, useState, ReactNode } from 'react';

export interface AuthUser {
  role: 'manager' | 'developer';
  userId: number;
  developerId?: number;
  managerId?: number;
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  signIn: (data: AuthUser) => void;
  signOut: () => void;
}

const AUTH_STORAGE_KEY = 'synkra_auth';

function loadFromStorage(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadFromStorage);

  function signIn(data: AuthUser) {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    setUser(data);
  }

  function signOut() {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
