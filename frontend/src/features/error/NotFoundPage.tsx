import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home, Compass, ShieldAlert } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Radial Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full text-center relative z-10 space-y-6">
        {/* Animated Badge & Icon */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-medium shadow-xl">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Error 404 • Path Not Found</span>
        </div>

        <div className="relative mx-auto w-24 h-24 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl shadow-brand-600/20 group">
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-600/20 to-purple-600/20 rounded-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <FileQuestion className="w-12 h-12 text-brand-400 relative z-10 animate-bounce" />
        </div>

        {/* 404 Heading & Subtitle */}
        <div className="space-y-2">
          <h1 className="text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
            404
          </h1>
          <h2 className="text-xl font-bold text-white tracking-tight">Oops! Page not found</h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            The module path or resource URL you requested doesn't exist, has been moved, or requires higher role privileges.
          </p>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-left text-xs space-y-2 text-slate-400">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Compass className="w-4 h-4 text-brand-400" />
            <span>Need assistance navigating?</span>
          </div>
          <p>
            Verify the URL address or use the primary controls below to return to your authorized Operations Portal workspace.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate(-1)}
            className="bg-slate-900 text-slate-200 border-slate-800 hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/dashboard')}
          >
            <Home className="w-4 h-4 mr-2" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
