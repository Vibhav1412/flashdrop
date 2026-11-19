'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ userId: number; email: string; role: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  const isAdmin = user?.role === 'admin';

  return (
    <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2 font-black text-xl tracking-tight text-white hover:opacity-90">
            <span className="text-rose-500 text-2xl">⚡</span>
            <span>FLASH<span className="text-rose-500">DROP</span></span>
          </Link>
          <nav className="hidden md:flex space-x-6 text-sm font-medium">
            <Link href="/" className="text-zinc-300 hover:text-white transition">Live Drops</Link>
            <Link href="/wallet" className="text-zinc-300 hover:text-white transition">Wallet &amp; Ledger</Link>
            <Link href="/referrals" className="text-zinc-300 hover:text-white transition">Referrals</Link>
          </nav>
        </div>

        <div className="flex items-center space-x-3 font-mono">
          {/* Admin Navigation: Only surfaced when signed in with Admin Role */}
          {isAdmin ? (
            <div className="flex items-center space-x-2">
              <Link
                href="/admin/queries"
                className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition"
              >
                SQL Console
              </Link>
              <Link
                href="/admin/dashboard"
                className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition"
              >
                Admin Telemetry
              </Link>
              <Link
                href="/admin/chaos"
                className="text-xs font-bold px-2.5 py-1.5 rounded-md bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 transition flex items-center space-x-1"
              >
                <span>🔥</span>
                <span>Chaos Mode</span>
              </Link>
            </div>
          ) : null}

          {/* User Session Pill */}
          {!loading && (
            user ? (
              <div className="flex items-center space-x-2 border-l border-zinc-800 pl-3">
                <div className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center space-x-1.5 ${
                  isAdmin 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}>
                  <span>{isAdmin ? '🛡️' : '👤'}</span>
                  <span className="uppercase">{user.role}</span>
                  <span className="text-zinc-400 font-normal">({user.name.split(' ')[0]})</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-[11px] text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700/80 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 border-l border-zinc-800 pl-3">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-sm"
                >
                  Sign In
                </Link>
              </div>
            )
          )}

          <div className="hidden lg:flex items-center space-x-2 border-l border-zinc-800 pl-3 text-[11px] text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>MySQL + Redis</span>
          </div>
        </div>
      </div>
    </header>
  );
}
