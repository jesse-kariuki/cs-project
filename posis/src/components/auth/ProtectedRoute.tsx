'use client';

import LoadingSpinner from '@/src/components/common/LoadingSpinner';
import { useAuth } from '@/src/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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