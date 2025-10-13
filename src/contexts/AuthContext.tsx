"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { operationsApi, handleApiError } from '@/lib/api';

interface User {
  id: string;
  email?: string;
  phone?: string;
  user_type: 'hospital' | 'operations' | 'collection_center' | 'rider';
  status: string;
  created_at: string;
  // Extended profile fields from backend
  name?: string;
  hospital_name?: string;
  center_name?: string;
  rider_name?: string;
  [key: string]: any; // Allow additional fields from profile
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<any>;
  verifyEmail: (email: string, otp: string) => Promise<any>;
  refreshToken: () => Promise<any>;
  checkAuthStatus: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState({
    user: null as User | null,
    isLoading: true,
    isAuthenticated: false,
    error: null as string | null,
  });

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const isValidToken = (token: string): boolean => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token is expired
      if (payload.exp && payload.exp < currentTime) {
        console.log('Token expired at:', new Date(payload.exp * 1000));
        return false;
      }

      // Check if token will expire soon (within 1 hour for operations users)
      if (payload.exp && payload.userType === 'operations' && payload.exp < currentTime + 3600) {
        console.log('Operations token expires soon, consider refreshing');
      }

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('operations_auth_token');
      if (!token) {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
        return;
      }

      if (!isValidToken(token)) {
        localStorage.removeItem('operations_auth_token');
        operationsApi.clearToken();
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
        return;
      }

      operationsApi.setToken(token);
      
      // Fetch user profile when we have a valid token
      try {
        const userProfile = await operationsApi.getProfile();
        if (userProfile.success && userProfile.data) {
          setAuthState({
            user: userProfile.data as User,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Even if profile fetch fails, keep user authenticated if token is valid
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      }
    } catch (error) {
      console.error('AuthContext: Auth check failed:', error);
      localStorage.removeItem('operations_auth_token');
      operationsApi.clearToken();
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await operationsApi.login(email, password);
      
      if (response.success && response.data) {
        const { access_token, user } = response.data;
        operationsApi.setToken(access_token);
        
        setAuthState({
          user: user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
        return response;
      } else {
        throw new Error(response.error?.message || 'Login failed');
      }
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      const errorMessage = handleApiError(error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await operationsApi.register(userData);
      
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Registration failed');
      }
      
      return response;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const verifyEmail = async (email: string, otp: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await operationsApi.verifyEmail(email, otp);
      
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Email verification failed');
      }
      
      return response;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await operationsApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
      operationsApi.clearToken();
    }
  };

  const refreshToken = async () => {
    try {
      const response = await operationsApi.refreshToken();
      if (response.success && response.data?.access_token) {
        operationsApi.setToken(response.data.access_token);
        return response;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      throw error;
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    register,
    verifyEmail,
    refreshToken,
    checkAuthStatus: checkAuth,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}