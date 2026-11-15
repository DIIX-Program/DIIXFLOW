'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Workflow, Lock, Mail, User, ArrowRight, Check, AlertCircle } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (data.success) {
        router.push('/onboarding');
      } else {
        setError(data.error || 'Failed to create account');
      }
    } catch {
      router.push('/onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col justify-center items-center p-6 select-none">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group mb-2">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent)] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Workflow className="w-6 h-6" />
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">Create your account</h1>
          <p className="text-xs text-[var(--muted)]">Start with the Free Individual Plan (2 workflows included)</p>
        </div>

        <div className="card p-6 sm:p-8 space-y-5 bg-[var(--card)] border border-[var(--line-strong)] shadow-xl">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-none" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[var(--ink)] block mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--card-2)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--ink)] block mb-1">Work Email</label>
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
              <label className="text-xs font-bold text-[var(--ink)] block mb-1">Password (min 8 characters)</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--card-2)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--card-2)] border border-[var(--line)] space-y-1.5 text-[11px] text-[var(--muted)]">
              <div className="flex items-center gap-1.5 text-[var(--good)] font-semibold">
                <Check className="w-3.5 h-3.5" /> <span>Free Personal Plan Assigned</span>
              </div>
              <p>You can create up to 2 workflows. Upgrade anytime to an Organization plan.</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 rounded-xl bg-[var(--accent)] text-white font-bold text-xs shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>{isLoading ? 'Creating account...' : 'Create Free Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--muted)]">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-[var(--accent)] hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
