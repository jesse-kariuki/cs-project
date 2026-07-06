# POSIS Frontend Design Specification (Next.js)

## Project Overview

The POSIS frontend is a modern React/Next.js application that provides a user interface for garage service management. It communicates with the Spring Boot backend via REST APIs, implements JWT-based authentication, and provides features for cashiers and administrators to manage invoices, inventory, payments, and financial reports.

---

## Technology Stack

### Core Technologies
- **Framework**: Next.js 14+ (App Router)
- **UI Library**: React 18+
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.x
- **HTTP Client**: Axios
- **State Management**: React Context API + useReducer (or Zustand for complex state)
- **Form Handling**: React Hook Form + Zod validation
- **Data Fetching**: React Query (TanStack Query)
- **Authentication**: JWT tokens in httpOnly cookies + localStorage backup
- **Components**: Headless UI / Shadcn/ui
- **Icons**: Lucide React
- **Testing**: Jest + React Testing Library
- **Build Tool**: Turbopack (Next.js default)
- **Package Manager**: npm/yarn/pnpm

### Development Tools
- **Linting**: ESLint
- **Code Formatting**: Prettier
- **Git Hooks**: Husky + lint-staged
- **Environment Variables**: .env.local

---

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout with providers
│   │   ├── page.tsx             # Home/Login page
│   │   ├── (auth)/              # Auth routes group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── logout/
│   │   │   │   └── route.ts     # API route handler
│   │   │   └── layout.tsx        # Auth layout (no sidebar)
│   │   ├── (dashboard)/          # Protected routes group
│   │   │   ├── layout.tsx        # Dashboard layout with sidebar
│   │   │   ├── page.tsx          # Dashboard home
│   │   │   ├── invoices/
│   │   │   │   ├── page.tsx      # Invoice list
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx  # Invoice detail/edit
│   │   │   │   └── new/
│   │   │   │       └── page.tsx  # Create invoice
│   │   │   ├── inventory/
│   │   │   │   ├── page.tsx      # Inventory list
│   │   │   │   ├── low-stock/
│   │   │   │   │   └── page.tsx  # Low stock alerts (admin only)
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Part detail/edit (admin only)
│   │   │   ├── payments/
│   │   │   │   └── page.tsx      # Payment history
│   │   │   ├── credits/
│   │   │   │   └── page.tsx      # Customer credit management
│   │   │   └── reports/
│   │   │       ├── page.tsx      # Reports dashboard (admin only)
│   │   │       ├── sales/
│   │   │       │   └── page.tsx
│   │   │       └── inventory/
│   │   │           └── page.tsx
│   │   └── api/
│   │       └── auth/
│   │           └── refresh/
│   │               └── route.ts  # JWT refresh endpoint
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── ProtectedLayout.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── LogoutButton.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── invoice/
│   │   │   ├── InvoiceForm.tsx
│   │   │   ├── InvoiceList.tsx
│   │   │   ├── InvoiceDetail.tsx
│   │   │   ├── InvoiceLineItems.tsx
│   │   │   ├── AddLineItemModal.tsx
│   │   │   ├── FinalizeInvoiceModal.tsx
│   │   │   └── InvoicePreview.tsx
│   │   ├── inventory/
│   │   │   ├── InventorySearch.tsx
│   │   │   ├── PartForm.tsx
│   │   │   ├── LowStockAlert.tsx
│   │   │   └── StockManagement.tsx
│   │   ├── payment/
│   │   │   ├── PaymentForm.tsx
│   │   │   ├── PaymentHistory.tsx
│   │   │   └── PaymentMethodSelector.tsx
│   │   ├── credit/
│   │   │   ├── CustomerCreditForm.tsx
│   │   │   ├── CreditLedger.tsx
│   │   │   └── CreditAlerts.tsx
│   │   ├── report/
│   │   │   ├── SalesReport.tsx
│   │   │   ├── InventoryReport.tsx
│   │   │   ├── ChartComponents.tsx
│   │   │   └── ReportFilters.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── Alert.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── Table.tsx
│   │       ├── Card.tsx
│   │       └── FormField.tsx
│   ├── hooks/
│   │   ├── useAuth.ts            # Auth context hook
│   │   ├── useApi.ts             # API call wrapper
│   │   ├── useUser.ts            # User data hook
│   │   ├── useInvoice.ts         # Invoice management hook
│   │   ├── useInventory.ts       # Inventory hook
│   │   ├── usePayment.ts         # Payment hook
│   │   ├── useCredit.ts          # Credit hook
│   │   ├── useForm.ts            # Form handling hook
│   │   └── useLocalStorage.ts    # Persistent state hook
│   ├── context/
│   │   ├── AuthContext.tsx       # Authentication state + provider
│   │   ├── NotificationContext.tsx # Toast/alert notifications
│   │   └── AppContext.tsx        # Global app state
│   ├── lib/
│   │   ├── api.ts               # Axios instance + interceptors
│   │   ├── auth.ts              # Auth utilities (JWT decode, etc)
│   │   ├── validators.ts        # Zod schemas for validation
│   │   ├── constants.ts         # App constants
│   │   ├── utils.ts             # Helper utilities
│   │   ├── storage.ts           # LocalStorage wrapper
│   │   ├── formatting.ts        # Number, date formatting
│   │   └── errors.ts            # Error handling utilities
│   ├── types/
│   │   ├── api.ts               # API response/request types
│   │   ├── entities.ts          # Domain models (User, Invoice, etc)
│   │   ├── forms.ts             # Form data types
│   │   └── errors.ts            # Error types
│   └── styles/
│       ├── globals.css
│       └── variables.css
├── public/
│   ├── images/
│   ├── icons/
│   └── favicon.ico
├── .env.local              # Local environment variables
├── .env.example            # Example env file
├── .eslintrc.json
├── .prettierrc.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Authentication Flow & JWT Implementation

### Authentication Context (AuthContext.tsx)

```typescript
// src/context/AuthContext.tsx
'use client';

import React, { createContext, useReducer, useCallback, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiClient from '@/lib/api';

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
```

### API Client with JWT Interceptors (lib/api.ts)

```typescript
// src/lib/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Include httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const authState = localStorage.getItem('auth_state');
    if (authState) {
      try {
        const { accessToken } = JSON.parse(authState);
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      } catch (error) {
        console.error('Failed to read auth state:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 and refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If 401 and not already retrying, attempt refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const authState = localStorage.getItem('auth_state');
        if (authState) {
          const { refreshToken } = JSON.parse(authState);
          const response = await apiClient.post('/auth/refresh', { refreshToken });
          const { accessToken } = response.data.data;

          // Update auth state
          const updated = JSON.parse(authState);
          updated.accessToken = accessToken;
          localStorage.setItem('auth_state', JSON.stringify(updated));

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('auth_state');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### useAuth Hook

```typescript
// src/hooks/useAuth.ts
'use client';

import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Protected Route Component

```typescript
// src/components/auth/ProtectedRoute.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'CASHIER';
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!state.isLoading && !state.isAuthenticated) {
      router.push('/login');
    }
    if (
      requiredRole &&
      state.user &&
      state.user.role !== requiredRole &&
      state.user.role !== 'ADMIN'
    ) {
      router.push('/');
    }
  }, [state.isLoading, state.isAuthenticated, state.user, requiredRole, router]);

  if (state.isLoading) {
    return <LoadingSpinner />;
  }

  if (!state.isAuthenticated) {
    return null;
  }

  if (requiredRole && state.user?.role !== requiredRole && state.user?.role !== 'ADMIN') {
    return <div>Access Denied</div>;
  }

  return <>{children}</>;
}
```

---

## Data Types & Validation (types/api.ts & lib/validators.ts)

### API Types

```typescript
// src/types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: number;
}

export interface ErrorResponse {
  success: false;
  status: number;
  error: string;
  message: string;
  timestamp: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface InvoiceResponse {
  id: number;
  invoiceNumber: string;
  dateCreated: string;
  partsAmount: number;
  laborAmount: number;
  grandTotal: number;
  paymentMethod: 'M-Pesa' | 'Cash' | 'Bank';
  status: 'DRAFT' | 'Paid' | 'Credit';
  customerId?: number;
  lineItems: InvoiceLineItem[];
  lowStockAlerts?: LowStockAlert[];
}

export interface InvoiceLineItem {
  id: number;
  partName: string;
  partId: number;
  quantity: number;
  priceCharged: number;
  subtotal: number;
}

export interface CreateInvoiceRequest {
  customerId?: number;
  laborAmount?: number;
}

export interface AddLineItemRequest {
  partId: number;
  quantity: number;
}

export interface FinalizeInvoiceRequest {
  paymentMethod: 'M-Pesa' | 'Cash' | 'Bank';
  amount: number;
  referenceNumber?: string;
}

export interface InventoryPart {
  id: number;
  sku: string;
  name: string;
  stockLevel: number;
  unitPrice: number;
  minThreshold: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface LowStockAlert {
  partId: number;
  partName: string;
  currentStock: number;
  minThreshold: number;
  unitPrice: number;
  reorderQty: number;
}

export interface PaymentRecord {
  id: number;
  invoiceId: number;
  method: string;
  amount: number;
  referenceNumber: string;
  dateProcessed: string;
}

export interface CustomerCredit {
  id: number;
  customerId: number;
  customerName: string;
  outstandingBalance: number;
  creditLimit: number;
  lastUpdated: string;
}
```

### Validation Schemas (lib/validators.ts)

```typescript
// src/lib/validators.ts
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createInvoiceSchema = z.object({
  customerId: z.number().optional(),
  laborAmount: z.number().min(0).optional(),
});

export const addLineItemSchema = z.object({
  partId: z.number().min(1, 'Part is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
});

export const finalizeInvoiceSchema = z.object({
  paymentMethod: z.enum(['M-Pesa', 'Cash', 'Bank']),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  referenceNumber: z.string().optional(),
});

export const createPartSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  unitPrice: z.number().min(0, 'Price must be non-negative'),
  minThreshold: z.number().min(0, 'Threshold must be non-negative'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type CreateInvoiceData = z.infer<typeof createInvoiceSchema>;
export type AddLineItemData = z.infer<typeof addLineItemSchema>;
export type FinalizeInvoiceData = z.infer<typeof finalizeInvoiceSchema>;
export type CreatePartData = z.infer<typeof createPartSchema>;
```

---

## Custom Hooks

### useApi Hook (for data fetching)

```typescript
// src/hooks/useApi.ts
'use client';

import { useCallback, useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { AxiosError } from 'axios';

interface UseApiState<T> {
  data: T | null;
  error: AxiosError | null;
  isLoading: boolean;
}

export function useApi<T>(url: string, shouldFetch = true) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    if (!shouldFetch) {
      setState({ data: null, error: null, isLoading: false });
      return;
    }

    const fetchData = async () => {
      try {
        const response = await apiClient.get<T>(url);
        setState({ data: response.data, error: null, isLoading: false });
      } catch (error) {
        setState({ data: null, error: error as AxiosError, isLoading: false });
      }
    };

    fetchData();
  }, [url, shouldFetch]);

  const refetch = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await apiClient.get<T>(url);
      setState({ data: response.data, error: null, isLoading: false });
    } catch (error) {
      setState({ data: null, error: error as AxiosError, isLoading: false });
    }
  }, [url]);

  return { ...state, refetch };
}
```

### useForm Hook

```typescript
// src/hooks/useForm.ts
'use client';

import { useState, useCallback } from 'react';
import { ZodSchema } from 'zod';

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
  validationSchema?: ZodSchema;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validationSchema,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        if (validationSchema) {
          const result = validationSchema.safeParse(values);
          if (!result.success) {
            const fieldErrors: any = {};
            result.error.errors.forEach(error => {
              const path = error.path[0] as string;
              fieldErrors[path] = error.message;
            });
            setErrors(fieldErrors);
            setIsSubmitting(false);
            return;
          }
        }

        setErrors({});
        await onSubmit(values);
      } catch (error: any) {
        setSubmitError(error.message || 'An error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validationSchema, onSubmit]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setSubmitError(null);
  }, [initialValues]);

  return {
    values,
    errors,
    isSubmitting,
    submitError,
    handleChange,
    handleSubmit,
    reset,
    setValues,
  };
}
```

---

## Component Examples

### LoginForm Component

```typescript
// src/components/auth/LoginForm.tsx
'use client';

import { useForm } from '@/hooks/useForm';
import { loginSchema, LoginFormData } from '@/lib/validators';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import FormField from '@/components/common/FormField';
import Alert from '@/components/common/Alert';

export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();

  const form = useForm<LoginFormData>({
    initialValues: { username: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      await login(values.username, values.password);
      router.push('/');
    },
  });

  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-bold mb-8 text-center">POSIS Garage</h1>
      
      {form.submitError && (
        <Alert type="error" message={form.submitError} className="mb-4" />
      )}

      <form onSubmit={form.handleSubmit} className="space-y-4">
        <FormField
          label="Username"
          name="username"
          type="text"
          value={form.values.username}
          onChange={form.handleChange}
          error={form.errors.username}
          disabled={form.isSubmitting}
        />

        <FormField
          label="Password"
          name="password"
          type="password"
          value={form.values.password}
          onChange={form.handleChange}
          error={form.errors.password}
          disabled={form.isSubmitting}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={form.isSubmitting}
        >
          {form.isSubmitting ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </div>
  );
}
```

### Invoice Form Component

```typescript
// src/components/invoice/InvoiceForm.tsx
'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import apiClient from '@/lib/api';
import { InvoiceResponse } from '@/types/api';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Alert from '@/components/common/Alert';
import InvoiceLineItems from './InvoiceLineItems';
import FinalizeInvoiceModal from './FinalizeInvoiceModal';

interface InvoiceFormProps {
  invoiceId?: number;
}

export default function InvoiceForm({ invoiceId }: InvoiceFormProps) {
  const [finalizing, setFinalizing] = useState(false);
  const { data: invoice, isLoading, error, refetch } = useApi<InvoiceResponse>(
    invoiceId ? `/invoices/${invoiceId}` : '',
    !!invoiceId
  );

  const handleCreateInvoice = async () => {
    try {
      const response = await apiClient.post('/invoices', {});
      // Redirect to new invoice
      window.location.href = `/invoices/${response.data.data.id}`;
    } catch (err) {
      console.error('Failed to create invoice:', err);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <Alert type="error" message="Failed to load invoice" />;

  return (
    <div className="space-y-6">
      {!invoiceId ? (
        <Button onClick={handleCreateInvoice}>Create New Invoice</Button>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">{invoice?.invoiceNumber}</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-gray-600">Status</p>
                <p className="text-lg font-semibold">{invoice?.status}</p>
              </div>
              <div>
                <p className="text-gray-600">Date</p>
                <p className="text-lg font-semibold">
                  {invoice?.dateCreated && new Date(invoice.dateCreated).toLocaleDateString()}
                </p>
              </div>
            </div>

            <InvoiceLineItems invoiceId={invoiceId} items={invoice?.lineItems || []} />

            <div className="mt-6 border-t pt-4 space-y-2">
              <div className="flex justify-between text-lg">
                <span>Parts Amount:</span>
                <span>KSh {invoice?.partsAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span>Labor Amount:</span>
                <span>KSh {invoice?.laborAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold">
                <span>Total:</span>
                <span>KSh {invoice?.grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {invoice?.status === 'DRAFT' && (
              <div className="mt-6">
                <Button
                  onClick={() => setFinalizing(true)}
                  variant="primary"
                  className="w-full"
                >
                  Finalize & Collect Payment
                </Button>
              </div>
            )}
          </div>

          {finalizing && (
            <FinalizeInvoiceModal
              invoiceId={invoiceId}
              grandTotal={invoice?.grandTotal || 0}
              onClose={() => setFinalizing(false)}
              onSuccess={() => {
                setFinalizing(false);
                refetch();
              }}
            />
          )}

          {invoice?.lowStockAlerts && invoice.lowStockAlerts.length > 0 && (
            <Alert
              type="warning"
              message={`${invoice.lowStockAlerts.length} items are low in stock`}
            />
          )}
        </>
      )}
    </div>
  );
}
```

---

## Page Structure Examples

### Dashboard Layout (app/(dashboard)/layout.tsx)

```typescript
// src/app/(dashboard)/layout.tsx
'use client';

import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
```

### Invoices Page (app/(dashboard)/invoices/page.tsx)

```typescript
// src/app/(dashboard)/invoices/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApi } from '@/hooks/useApi';
import { InvoiceResponse } from '@/types/api';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Alert from '@/components/common/Alert';

export default function InvoicesPage() {
  const { data: invoices, isLoading, error, refetch } = useApi<InvoiceResponse[]>(
    '/invoices'
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <Link href="/invoices/new">
          <Button>Create Invoice</Button>
        </Link>
      </div>

      {error && <Alert type="error" message="Failed to load invoices" />}

      {invoices && invoices.length > 0 ? (
        <Table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(invoice => (
              <tr key={invoice.id}>
                <td>{invoice.invoiceNumber}</td>
                <td>{new Date(invoice.dateCreated).toLocaleDateString()}</td>
                <td>KSh {invoice.grandTotal.toLocaleString()}</td>
                <td>
                  <span className={`px-3 py-1 rounded text-sm ${
                    invoice.status === 'Paid' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {invoice.status}
                  </span>
                </td>
                <td>
                  <Link href={`/invoices/${invoice.id}`}>
                    <Button variant="secondary" size="sm">View</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Alert type="info" message="No invoices found" />
      )}
    </div>
  );
}
```

---

## Environment Configuration

### .env.example

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# JWT Configuration
NEXT_PUBLIC_JWT_STORAGE_KEY=auth_state

# Feature Flags
NEXT_PUBLIC_ENABLE_REPORTS=true
NEXT_PUBLIC_ENABLE_CREDITS=true
```

### .env.local (development)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### Production Environment

```env
NEXT_PUBLIC_API_URL=https://api.posis.com/api
```

---

## Styling & Design System

### Tailwind Configuration (tailwind.config.ts)

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
```

### Global Styles (styles/globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom components */
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50;
  }

  .btn-secondary {
    @apply px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors;
  }

  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }

  .input-field {
    @apply w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500;
  }
}
```

---

## Error Handling & Notifications

### Global Error Boundary

```typescript
// src/components/common/ErrorBoundary.tsx
'use client';

import React, { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Error caught by boundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-red-700 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## Testing Strategy

### Testing Setup (jest.config.js)

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

### Component Test Example

```typescript
// src/components/auth/__tests__/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '../LoginForm';
import { AuthContext } from '@/context/AuthContext';

describe('LoginForm', () => {
  it('renders login form with username and password fields', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <LoginForm />
      </AuthContext.Provider>
    );

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('submits form with valid credentials', async () => {
    const mockLogin = jest.fn();
    
    render(
      <AuthContext.Provider value={{ ...mockAuthContext, login: mockLogin }}>
        <LoginForm />
      </AuthContext.Provider>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
    });
  });
});
```

---

## Deployment Checklist

### Build & Optimization
- [ ] Run `npm run build` and verify no errors
- [ ] Check bundle size with `npm run analyze`
- [ ] Optimize images in `/public`
- [ ] Enable static optimization for static pages
- [ ] Configure caching headers for assets

### Security
- [ ] Set NEXT_PUBLIC_API_URL to production backend URL
- [ ] Enable HTTPS enforcement
- [ ] Configure security headers (CSP, HSTS, X-Frame-Options)
- [ ] Remove console.log statements for sensitive data
- [ ] Validate all environment variables are set
- [ ] Enable SameSite cookie restrictions

### Performance
- [ ] Configure CDN for static assets
- [ ] Enable gzip compression
- [ ] Set up database connection pooling on backend
- [ ] Configure rate limiting on authentication endpoints
- [ ] Enable caching for API responses where appropriate

### Monitoring & Logging
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Configure analytics
- [ ] Set up performance monitoring
- [ ] Enable request logging on backend
- [ ] Create dashboard for system health

### Testing
- [ ] Run full test suite
- [ ] Perform manual testing of critical flows
- [ ] Test authentication with valid/invalid credentials
- [ ] Test invoice creation and finalization
- [ ] Test error scenarios and edge cases
- [ ] Performance testing with load testing tools

---

## Development Workflow

### Getting Started

```bash
# Clone repository
git clone <repo-url>
cd posis-frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Update API URL if needed
# Edit .env.local: NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run analyze      # Analyze bundle size
```

### Code Quality Tools

```bash
# Format code with Prettier
npm run format

# Run pre-commit hooks
npm run prepare

# Type checking
npm run type-check

# Linting
npm run lint --fix
```

---

## Key Integration Points with Backend

| Feature | Backend Endpoint | Frontend Component | Status |
|---------|------------------|------------------|--------|
| User Login | POST /auth/login | LoginForm | Core |
| Token Refresh | POST /auth/refresh | AuthContext | Core |
| Logout | POST /auth/logout | TopBar/LogoutButton | Core |
| Create Invoice | POST /invoices | InvoiceForm | Core |
| Add Line Item | POST /invoices/{id}/items | InvoiceLineItems | Core |
| Finalize Invoice | POST /invoices/{id}/finalize | FinalizeInvoiceModal | Core |
| Search Parts | GET /inventory/search?q= | InventorySearch | Core |
| Low Stock Alert | GET /inventory/low-stock | DashboardHome | Admin |
| Payment History | GET /payments | PaymentHistory | Core |
| Credit Management | GET/POST /credits | CreditLedger | Core |
| Reports | GET /reports/* | ReportComponents | Admin |

---

## Performance Optimization Tips

1. **Code Splitting**: Leverage Next.js automatic code splitting per page
2. **Image Optimization**: Use next/image component for all images
3. **API Caching**: Implement React Query for smart caching
4. **State Management**: Keep state close to where it's used
5. **Lazy Loading**: Implement lazy loading for modals and heavy components
6. **Memoization**: Use React.memo() for expensive computations
7. **Debouncing**: Debounce search and form input handlers
8. **Static Generation**: Use ISR/SSG for static content where possible

---

## Security Best Practices

1. **Never expose sensitive tokens in URL**
2. **Use httpOnly cookies when possible**
3. **Validate all user input on frontend (UX) and backend (security)**
4. **Sanitize HTML content to prevent XSS**
5. **Use HTTPS in production**
6. **Implement CSRF protection**
7. **Secure localStorage usage**
8. **Implement proper error handling without exposing sensitive details**
9. **Regularly update dependencies**
10. **Use Content Security Policy headers**

