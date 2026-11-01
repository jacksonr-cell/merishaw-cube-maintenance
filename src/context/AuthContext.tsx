import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types.ts';
import { api, tokenStorage } from '../api/client.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  quickLogin: (identifier: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await api.getCurrentUser();
      setUser(res.user);
    } catch (err) {
      tokenStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = tokenStorage.get();
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await api.login(identifier, password);
    tokenStorage.set(res.token);
    setUser(res.user);
  };

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
  };

  const quickLogin = async (identifier: string, password: string) => {
    await login(identifier, password);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, quickLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
