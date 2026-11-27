import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Mail, Lock, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PartnerLoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await signIn(email, password);
      if (res.error) {
        setError(res.error.message || 'Invalid partner credentials');
      } else {
        navigate('/partner/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-12 text-slate-100">
      <div className="bg-slate-800/90 rounded-3xl p-8 sm:p-10 border border-slate-700 shadow-2xl max-w-md w-full space-y-6 backdrop-blur-md">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center mx-auto mb-2">
            <Store className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-orange-400">
            YUMMY Partner Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Restaurant Sign In
          </h1>
          <p className="text-xs text-slate-400">
            Manage your kitchen orders, live menu, and business analytics.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Registered Restaurant Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="owner@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-full font-bold text-sm text-white bg-orange-500 hover:bg-orange-600 disabled:bg-slate-700 shadow-lg transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Access Restaurant Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-400 space-y-2">
          <p>
            Don't have an approved partner account?{' '}
            <Link to="/partner/apply" className="font-bold text-orange-400 hover:underline">
              Apply to become a partner
            </Link>
          </p>
          <p>
            <Link to="/partner/status" className="text-slate-500 hover:text-slate-300">
              Check application status
            </Link>
            {' • '}
            <Link to="/" className="text-slate-500 hover:text-slate-300">
              Return to Public Website
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
