import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, Zap, Flame } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950/70 to-amber-950/80 text-amber-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Iron Man Glow Arc Reactor Lighting Effect */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] bg-amber-500/20 rounded-full blur-2xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-700/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full text-center relative z-10 space-y-6">
        {/* Iron Man Arc Armor Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/90 border border-amber-500/40 text-amber-200 text-xs font-bold shadow-xl shadow-red-950/50 backdrop-blur-md">
          <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
          <span className="tracking-wide uppercase">System Offline • Error 404</span>
        </div>

        {/* Hot Red + Metallic Gold Arc Core Badge */}
        <div className="relative mx-auto w-28 h-28 rounded-full bg-gradient-to-br from-red-900 via-amber-950 to-slate-950 border-2 border-amber-400/80 flex items-center justify-center shadow-2xl shadow-red-600/40 group">
          <div className="absolute inset-0 bg-gradient-to-tr from-red-600/30 to-amber-400/30 rounded-full opacity-70 group-hover:opacity-100 transition-opacity" />
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 via-red-600 to-amber-500 p-0.5 shadow-inner">
            <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
              <Flame className="w-9 h-9 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Hot Red & Gold 404 Heading */}
        <div className="space-y-2">
          <h1 className="text-7xl font-black tracking-extratight text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-amber-100 drop-shadow-md">
            404
          </h1>
          <h2 className="text-2xl font-bold text-amber-100 tracking-tight">
            System Subroutine Not Responding
          </h2>
          <p className="text-sm text-amber-100/80 leading-relaxed max-w-sm mx-auto font-medium">
            This module route or requested resource path is offline or does not exist. Your access permissions remain active for working portal modules.
          </p>
        </div>

        {/* Iron Man Gold Armor Status Box */}
        <div className="p-4 bg-red-950/40 rounded-2xl border border-amber-500/30 text-left text-xs space-y-2 text-amber-200/90 shadow-lg backdrop-blur-xs">
          <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-wider text-[11px]">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>JARVIS Diagnostic Notice</span>
          </div>
          <p className="text-amber-100/90 leading-normal">
            The error screen triggers strictly when non-existent endpoints or invalid URLs are accessed ("only when it's not working"). Return to active operations below.
          </p>
        </div>

        {/* Hot Red & Metallic Gold Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate(-1)}
            className="bg-amber-950/60 text-amber-200 border-amber-500/40 hover:bg-amber-900/80 hover:text-white font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2 text-amber-400" />
            Go Back
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-red-600 via-red-700 to-amber-600 text-amber-50 hover:from-red-500 hover:to-amber-500 font-bold shadow-lg shadow-red-600/30 border border-amber-400/40"
          >
            <Home className="w-4 h-4 mr-2 text-amber-200" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
