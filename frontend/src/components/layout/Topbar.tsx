import React from 'react';
import { useAuth } from '../../lib/auth-context';
import { Badge, BadgeVariant } from '../ui/Badge';
import { LogOut, User as UserIcon } from 'lucide-react';

export const Topbar: React.FC = () => {
  const { user, logout } = useAuth();

  const roleVariantMap: Record<string, BadgeVariant> = {
    ADMIN: 'admin',
    SALES: 'sales',
    WAREHOUSE: 'warehouse',
    ACCOUNTS: 'accounts',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Operations Portal</span>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-800">Mini ERP + CRM</span>
      </div>

      <div className="flex items-center gap-4">
        {/* User Account Info */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full">
          <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-slate-900 leading-none">{user?.name || 'Operations User'}</p>
            <p className="text-[11px] text-slate-500 font-medium leading-tight">{user?.email}</p>
          </div>
          <Badge variant={roleVariantMap[user?.role || 'ADMIN']} size="sm">
            {user?.role}
          </Badge>
        </div>

        {/* Logout Action Button */}
        <button
          onClick={logout}
          title="Sign out of your session"
          className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
