import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/crm.ts';
import { api, getStoredToken, removeStoredToken } from '../lib/api.ts';

const SIGNED_OUT_FLAG = 'qavon_desk_signed_out';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  demoMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, companyName?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (userId: string) => Promise<void>;
  canManageUsers: boolean;
  canDeleteRecords: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    async function initAuth() {
      try {
        const config = await api.getAuthConfig().catch(() => ({ demoMode: false }));
        setDemoMode(config.demoMode);

        if (sessionStorage.getItem(SIGNED_OUT_FLAG) === 'true') {
          setUser(null);
          return;
        }

        const existingToken = getStoredToken();
        if (existingToken) {
          try {
            const data = await api.getMe();
            setUser(data.user);
            return;
          } catch {
            removeStoredToken();
          }
        }

        if (config.demoMode) {
          const demoData = await api.demoSession();
          setUser(demoData.user);
        }
      } catch (err) {
        console.warn('Initial session check resolved without active session:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    sessionStorage.removeItem(SIGNED_OUT_FLAG);
    const data = await api.login(email, password);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string, companyName?: string) => {
    sessionStorage.removeItem(SIGNED_OUT_FLAG);
    const data = await api.register(name, email, password, companyName);
    setUser(data.user);
  };

  const logout = async () => {
    sessionStorage.setItem(SIGNED_OUT_FLAG, 'true');
    await api.logout();
    setUser(null);
  };

  const switchRole = async (userId: string) => {
    sessionStorage.removeItem(SIGNED_OUT_FLAG);
    const data = await api.switchRole(userId);
    setUser(data.user);
  };

  const canManageUsers = user?.role === 'OWNER' || user?.role === 'ADMIN';
  const canDeleteRecords = user?.role === 'OWNER' || user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        demoMode,
        login,
        register,
        logout,
        switchRole,
        canManageUsers,
        canDeleteRecords,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
