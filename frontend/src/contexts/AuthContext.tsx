import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, tokenStorage, User } from '@/lib/api/auth';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = tokenStorage.get();
    if (token) {
      verifySession();
    } else {
      setLoading(false);
    }
  }, []);

  const verifySession = async () => {
    try {
      const response = await authApi.verify();
      setUser(response.user);
    } catch {
      // apiRequest already attempted a silent refresh; if we still fail, clear everything
      tokenStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    tokenStorage.set(response.token);
    tokenStorage.setRefresh(response.refreshToken);
    setUser(response.user);
  };

  const logout = () => {
    const refreshToken = tokenStorage.getRefresh() ?? undefined;
    authApi.logout(refreshToken);
    tokenStorage.clear();
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
