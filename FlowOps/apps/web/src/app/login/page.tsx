'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Workflow, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { ShimmerButton } from '@/components/ui/shimmer-button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        // Platform admin routes directly to /diix
        if (data.user?.isPlatformAdmin) {
          router.push('/diix');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      // Fallback dev redirect
      if (email.includes('admin')) {
        router.push('/diix');
      } else {
        router.push('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col justify-center items-center p-6 select-none">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group mb-2">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent)] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Workflow className="w-6 h-6" />
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">Sign in to FlowOps</h1>
          <p className="text-xs text-[var(--muted)]">Enter your credentials to access your workflow workspace</p>
        </div>

        {/* Login Card */}
        <div className="card p-6 sm:p-8 space-y-5 bg-[var(--card)] border border-[var(--line-strong)] shadow-xl">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-none" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[var(--ink)] block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--card-2)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[var(--ink)]">Password</label>
                <Link href="/forgot-password" className="text-[11px] text-[var(--accent)] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--card-2)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 rounded-xl bg-[var(--accent)] text-white font-bold text-xs shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="p-3 rounded-xl bg-[var(--card-2)] border border-[var(--line)] text-[11px] text-[var(--muted)] flex items-center justify-between">
            <span className="font-mono">admin@flowops.cloud</span>
            <span className="text-[var(--accent)] font-bold">Routes to /diix</span>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-[var(--muted)]">
          Don't have an account?{' '}
          <Link href="/signup" className="font-bold text-[var(--accent)] hover:underline">
            Create Free Account
          </Link>
        </p>
      </div>
    </div>
  );
}
