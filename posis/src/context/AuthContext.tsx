'use client';

import apiClient from '@/src/lib/api';
import { jwtDecode } from 'jwt-decode';
import React, { createContext, useCallback, useEffect, useReducer } from 'react';

export interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'CASHIER';
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: string }
  | { type: 'RESTORE_SESSION'; payload: AuthState }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

export const AuthContext = createContext<{
  state: AuthState;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
} | undefined>(undefined);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        isAuthenticated: false,
      };
    case 'LOGOUT':
      return initialState;
    case 'REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        accessToken: action.payload,
      };
    case 'RESTORE_SESSION':
      return action.payload;
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session from localStorage on mount
  useEffect(() => {
    const restoreSession = () => {
      const stored = localStorage.getItem('auth_state');
      if (stored) {
        try {
          const parsedState = JSON.parse(stored);
          // Validate token is not expired
          if (parsedState.accessToken && !isTokenExpired(parsedState.accessToken)) {
            dispatch({ type: 'RESTORE_SESSION', payload: parsedState });
          } else {
            // Try to refresh token
            refreshAccessToken();
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
          localStorage.removeItem('auth_state');
        }
      }
      dispatch({ type: 'SET_ERROR', payload: null });
    };

    restoreSession();
  }, []);

  // Persist auth state to localStorage
  useEffect(() => {
    if (state.isAuthenticated) {
      localStorage.setItem('auth_state', JSON.stringify(state));
    } else {
      localStorage.removeItem('auth_state');
    }
  }, [state]);

  const login = useCallback(async (username: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      const { user, accessToken, refreshToken } = response.data.data;
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, accessToken, refreshToken },
      });
      // Token will be set in httpOnly cookie by backend
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      localStorage.removeItem('auth_state');
    }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    try {
      const response = await apiClient.post('/auth/refresh', {
        refreshToken: state.refreshToken,
      });
      dispatch({
        type: 'REFRESH_TOKEN_SUCCESS',
        payload: response.data.data.accessToken,
      });
    } catch (error) {
      dispatch({ type: 'LOGOUT' });
      localStorage.removeItem('auth_state');
    }
  }, [state.refreshToken]);

  return (
    <AuthContext.Provider value={{ state, login, logout, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

function isTokenExpired(token: string): boolean {
  try {
    const decoded: any = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}