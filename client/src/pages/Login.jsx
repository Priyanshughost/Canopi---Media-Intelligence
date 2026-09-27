import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  Building,
} from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoLoggingIn, setIsDemoLoggingIn] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setIsDemoLoggingIn(true);
    setEmail('demo@canopi.test');
    setPassword('Demo@1234');

    try {
      await login('demo@canopi.test', 'Demo@1234');
      navigate(from, { replace: true });
    } catch (err) {
      setError('Demo login failed: ' + (err.message || 'Please verify server is running.'));
    } finally {
      setIsDemoLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100/80 p-4 relative overflow-hidden">
      {/* Soft Background Accents */}
      <div className="absolute top-10 left-1/4 w-80 h-80 bg-cyan-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-slate-200/50 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
              <Activity size={20} />
            </div>
            <span className="text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
              Canopi
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            AI-Powered Impact & Sustainability Media Intelligence
          </p>
        </div>

        {/* Demo Account Box */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 mb-5 shadow-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Sparkles size={16} className="text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Judge / Tester Quick Access
              </span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30">
              Instant Demo
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            One-click login to the pre-seeded <b>Demo NGO</b> workspace with full access to projects, media, evidence, and AI reports.
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isDemoLoggingIn || isSubmitting}
            className="w-full py-2.5 px-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {isDemoLoggingIn ? (
              <>
                <Loader2 size={14} className="animate-spin text-slate-950" />
                <span>Signing in to Demo Workspace...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>One-Click Login as Demo NGO</span>
              </>
            )}
          </button>
        </div>

        {/* Standard Login Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200/80">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">Sign In to Your Workspace</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter your organization credentials</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2 animate-in fade-in">
              <AlertCircle size={15} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.org"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isDemoLoggingIn}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Need a separate workspace for your NGO or CSR team?{' '}
              <Link to="/signup" className="text-cyan-700 hover:text-cyan-800 font-bold underline-offset-2 hover:underline">
                Create Organization Workspace
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
