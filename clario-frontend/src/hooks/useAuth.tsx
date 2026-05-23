import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/api/axios';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('clairo_token'));
  const [isFetching, setIsFetching] = useState(true);

  // Computed property ensures we never render ProtectedRoute children if a token exists but user isn't fetched yet
  const isLoading = isFetching || (!!token && !user);

  useEffect(() => {
    if (token) {
      setIsFetching(true);
      api.get('/v1/auth/me')
        .then(res => {
          setUser(res.data.data || res.data);
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setIsFetching(false);
        });
    } else {
      setIsFetching(false);
    }
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('clairo_token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('clairo_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
