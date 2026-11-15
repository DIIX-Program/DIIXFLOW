'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Workflow, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
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
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">Reset Password</h1>
          <p className="text-xs text-[var(--muted)]">Enter your email and we will send password reset instructions</p>
        </div>

        <div className="card p-6 sm:p-8 space-y-5 bg-[var(--card)] border border-[var(--line-strong)] shadow-xl">
          {sent ? (
            <div className="text-center space-y-3 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[var(--ink)]">Reset Instructions Sent</h3>
              <p className="text-xs text-[var(--muted)]">
                If an account exists for <span className="font-semibold text-[var(--ink)]">{email}</span>, you will receive a secure reset link shortly.
              </p>
              <Link href="/login" className="inline-block pt-2 text-xs font-bold text-[var(--accent)] hover:underline">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--card-2)] text-[var(--ink)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-10 rounded-xl bg-[var(--accent)] text-white font-bold text-xs shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-[var(--muted)]">
          Remember your password?{' '}
          <Link href="/login" className="font-bold text-[var(--accent)] hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
