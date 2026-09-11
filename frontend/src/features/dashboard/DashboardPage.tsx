import React from 'react';
import { useAuth } from '../../lib/auth-context';
import { Badge } from '../../components/ui/Badge';
import { Users, Package, FileText, TrendingUp, ShieldCheck } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold mb-3 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Session Authenticated as {user?.role}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name}!</h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Mini ERP + CRM Operations Portal. Use the sidebar to navigate modules based on your role privileges.
            </p>
          </div>
          <Badge variant={(user?.role?.toLowerCase() as any) || 'admin'} size="md">
            {user?.role} Role
          </Badge>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Customer Leads</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">24</p>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> +12% this month
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Products Tracked</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">148</p>
            <p className="text-[11px] text-amber-600 font-medium mt-1">3 low stock items</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sales Challans</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">32</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">5 drafts pending</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">RBAC Policy</p>
            <p className="text-sm font-bold text-slate-900 mt-1">{user?.role} Matrix</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">Active & Enforced</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};
