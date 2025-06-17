import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/store/authStore';
import { useRolePermission } from '@/entities/rolePermission';
import type { RoleName } from '@/shared/types/rolePermission';

interface Props {
  page: string;
  children: JSX.Element;
}

export default function RequirePermission({ page, children }: Props) {
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm, isLoading } = useRolePermission(role);

  if (isLoading) return null;

  if (role === 'ADMIN' || perm?.pages.includes(page)) return children;

  return <Navigate to="/" replace />;
}
