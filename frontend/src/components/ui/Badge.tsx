import React from 'react';
import { clsx } from 'clsx';

export type BadgeVariant =
  | 'draft'
  | 'confirmed'
  | 'cancelled'
  | 'lead'
  | 'active'
  | 'inactive'
  | 'retail'
  | 'wholesale'
  | 'distributor'
  | 'lowStock'
  | 'admin'
  | 'sales'
  | 'warehouse'
  | 'accounts'
  | 'neutral';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className,
  size = 'md',
}) => {
  const base = 'inline-flex items-center font-semibold rounded-full border';

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] tracking-wide uppercase',
    md: 'px-2.5 py-0.5 text-xs font-medium',
  };

  const variants: Record<BadgeVariant, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-300',
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-300',
    lead: 'bg-sky-50 text-sky-700 border-sky-300',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200',
    retail: 'bg-purple-50 text-purple-700 border-purple-300',
    wholesale: 'bg-indigo-50 text-indigo-700 border-indigo-300',
    distributor: 'bg-blue-50 text-blue-700 border-blue-300',
    lowStock: 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse',
    admin: 'bg-purple-100 text-purple-800 border-purple-300',
    sales: 'bg-blue-100 text-blue-800 border-blue-300',
    warehouse: 'bg-amber-100 text-amber-800 border-amber-300',
    accounts: 'bg-teal-100 text-teal-800 border-teal-300',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span className={clsx(base, sizes[size], variants[variant], className)}>
      {children}
    </span>
  );
};
