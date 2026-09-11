import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { Role } from '../../lib/types';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  roles: Role[]; // Roles that can access this module
  viewOnlyFor?: Role[]; // Roles that have view-only access
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || 'ADMIN';

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
    },
    {
      name: 'Customer CRM',
      path: '/customers',
      icon: <Users className="w-5 h-5" />,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
      viewOnlyFor: ['WAREHOUSE', 'ACCOUNTS'],
    },
    {
      name: 'Products & Stock',
      path: '/products',
      icon: <Package className="w-5 h-5" />,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
      viewOnlyFor: ['SALES', 'ACCOUNTS'],
    },
    {
      name: 'Sales Challans',
      path: '/challans',
      icon: <FileText className="w-5 h-5" />,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
      viewOnlyFor: ['WAREHOUSE', 'ACCOUNTS'],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-30 transition-all">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-brand-600/30">
          E
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-tight tracking-tight">Mini ERP Portal</h1>
          <p className="text-[11px] text-slate-400 font-medium">Ops & CRM Platform</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Main Modules
        </div>
        {navItems.map((item) => {
          const isViewOnly = item.viewOnlyFor?.includes(role);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg font-medium text-sm transition-colors group ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                }`
              }
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.name}</span>
              </div>
              {isViewOnly && (
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Read Only
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Role Notice Card */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-brand-400 flex-shrink-0" />
          <div className="text-xs">
            <p className="text-slate-300 font-semibold">{role} Role Active</p>
            <p className="text-slate-400 text-[11px]">RBAC Permissions Enforced</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
