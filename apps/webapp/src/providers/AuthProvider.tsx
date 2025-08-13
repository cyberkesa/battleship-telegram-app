import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: any;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { 
    isAuthenticated, 
    isLoading, 
    error, 
    user, 
    clearError 
  } = useAuthStore();

  useEffect(() => {
    // Check for existing token on app start
    const token = localStorage.getItem('auth_token');
    if (token && !isAuthenticated) {
      // Token exists but user is not authenticated, try to validate
      // This could trigger a token refresh or re-authentication
    }
  }, [isAuthenticated]);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    error,
    user,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
