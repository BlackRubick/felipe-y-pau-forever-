// ============================================================================
// AUTH CONTEXT - Manejo de autenticación global
// ============================================================================

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, AuthResponse, LoginFormData, RegisterFormData } from '../types';
import authService from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar autenticación al montar
  useEffect(() => {
    if (authService.isAuthenticated() && !user) {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    }
  }, [user]);

  const login = useCallback(async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response: AuthResponse = await authService.login(data);
      setUser(response.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en login';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response: AuthResponse = await authService.register(data);
      setUser(response.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en registro';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    register,
    logout,
    clearError,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook para usar el contexto de autenticación
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
