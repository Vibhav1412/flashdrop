'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    setLoading(true);
    setError(null);

    const payload = {
      email: loginEmail || email,
      password: loginPassword || password,
    };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        if (data.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/');
        }
        router.refresh();
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch {
      setError('Network error during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-6 shadow-2xl">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono font-bold">
          <span>⚡ RBAC SESSION AUTHENTICATION</span>
        </div>
        <h1 className="text-2xl font-black text-white">Sign In to FlashDrop</h1>
        <p className="text-xs text-zinc-400">
          Enforces least-privilege connection routing across MySQL 8 roles &amp; Redis sessions.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
          ⚠️ {error}
        </div>
      )}

      {/* Quick Role Selection for Evaluators / Viva Demo */}
      <div className="space-y-2.5 pt-2">
        <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block font-semibold">
          ⚡ 1-Click Role Switcher (Evaluation Demo):
        </span>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleLogin('user_2@flashdrop.com', 'customer123')}
            disabled={loading}
            className="p-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-left transition group"
          >
            <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-bold font-mono">
              <span>👤</span>
              <span>Customer</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-1 truncate">user_2@flashdrop.com</div>
            <div className="text-[9px] text-zinc-500 font-mono mt-0.5">Least-privilege role</div>
          </button>

          <button
            type="button"
            onClick={() => handleLogin('admin@flashdrop.com', 'admin123')}
            disabled={loading}
            className="p-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-rose-500/30 text-left transition group"
          >
            <div className="flex items-center space-x-1.5 text-rose-400 text-xs font-bold font-mono">
              <span>🛡️</span>
              <span>Admin</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-1 truncate">admin@flashdrop.com</div>
            <div className="text-[9px] text-zinc-500 font-mono mt-0.5">Full DBA telemetry</div>
          </button>
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-zinc-800 w-full"></div>
        <span className="bg-zinc-900 px-3 text-[10px] uppercase font-mono text-zinc-500">or enter credentials</span>
      </div>

      {/* Standard Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
        className="space-y-4 text-xs font-mono"
      >
        <div className="space-y-1">
          <label className="text-zinc-400 block uppercase text-[10px]">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user_2@flashdrop.com"
            required
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500 text-xs font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-zinc-400 block uppercase text-[10px]">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500 text-xs font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-rose-600/30"
        >
          {loading ? 'Authenticating with MySQL & Redis...' : 'Sign In'}
        </button>
      </form>

      <div className="text-center pt-2">
        <Link href="/" className="text-xs text-zinc-500 hover:text-white transition">
          &larr; Back to Storefront
        </Link>
      </div>
    </div>
  );
}
