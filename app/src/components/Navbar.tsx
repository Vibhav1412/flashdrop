'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ userId: number; email: string; role: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSwitchDropdown, setShowSwitchDropdown] = useState(false);

  const fetchSession = () => {
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
  };

  useEffect(() => {
    fetchSession();
    window.addEventListener('flashdrop_auth_change', fetchSession);
    return () => window.removeEventListener('flashdrop_auth_change', fetchSession);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.dispatchEvent(new Event('flashdrop_auth_change'));
    router.push('/login');
    router.refresh();
  };

  const handleSwitchAccount = async (email: string, password: string) => {
    setShowSwitchDropdown(false);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        window.dispatchEvent(new Event('flashdrop_auth_change'));
        router.refresh();
      }
    } catch (e) {
      console.error('Account switch failed', e);
    }
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

          {/* User Session Pill & Quick Account Switcher */}
          {!loading && (
            user ? (
              <div className="relative flex items-center space-x-2 border-l border-zinc-800 pl-3">
                <button
                  type="button"
                  onClick={() => setShowSwitchDropdown(!showSwitchDropdown)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center space-x-1.5 transition hover:brightness-110 ${
                    isAdmin 
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}
                  title="Click to Switch Customer / Admin Account"
                >
                  <span>{isAdmin ? '🛡️' : '👤'}</span>
                  <span className="uppercase">{user.role}</span>
                  <span className="text-zinc-400 font-normal">({user.name.split(' ')[0]})</span>
                  <span className="text-[9px] text-zinc-500">▼</span>
                </button>

                {/* Account Switcher Dropdown */}
                {showSwitchDropdown && (
                  <div className="absolute top-10 right-0 w-64 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl p-2 z-50 font-sans space-y-1">
                    <div className="text-[10px] font-mono uppercase text-zinc-500 px-2 py-1 font-semibold flex items-center justify-between">
                      <span>Switch Persona (Demo)</span>
                      <span className="text-[9px] text-emerald-400">1-Click</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSwitchAccount('admin@flashdrop.com', 'admin123')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                        isAdmin ? 'bg-rose-950/60 text-rose-300 font-bold border border-rose-800/50' : 'text-zinc-300 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>🛡️</span>
                        <div>
                          <div>Admin</div>
                          <div className="text-[9px] text-zinc-500 font-mono">admin@flashdrop.com</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-rose-400">DBA</span>
                    </button>

                    <div className="border-t border-zinc-800 my-1"></div>
                    <div className="text-[9px] font-mono uppercase text-emerald-400 px-2 py-0.5 font-semibold">
                      Customer Personas
                    </div>

                    {/* Customer 1 */}
                    <button
                      type="button"
                      onClick={() => handleSwitchAccount('user_2@flashdrop.com', 'customer123')}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                        user.email === 'user_2@flashdrop.com' ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-800/50' : 'text-zinc-300 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>👤</span>
                        <div>
                          <div className="text-xs">Customer 1 (Buyer2)</div>
                          <div className="text-[9px] text-zinc-500 font-mono">2 orders • Platinum</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400">$376.00</span>
                    </button>

                    {/* Customer 2 */}
                    <button
                      type="button"
                      onClick={() => handleSwitchAccount('user_3@flashdrop.com', 'customer123')}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                        user.email === 'user_3@flashdrop.com' ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-800/50' : 'text-zinc-300 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>👤</span>
                        <div>
                          <div className="text-xs">Customer 2 (Buyer3)</div>
                          <div className="text-[9px] text-zinc-500 font-mono">1 order • Gold</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400">$820.50</span>
                    </button>

                    {/* Customer 3 */}
                    <button
                      type="button"
                      onClick={() => handleSwitchAccount('user_4@flashdrop.com', 'customer123')}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                        user.email === 'user_4@flashdrop.com' ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-800/50' : 'text-zinc-300 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>👤</span>
                        <div>
                          <div className="text-xs">Customer 3 (Buyer4)</div>
                          <div className="text-[9px] text-zinc-500 font-mono">2 orders • Silver</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400">$145.00</span>
                    </button>

                    {/* Customer 4 */}
                    <button
                      type="button"
                      onClick={() => handleSwitchAccount('user_5@flashdrop.com', 'customer123')}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                        user.email === 'user_5@flashdrop.com' ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-800/50' : 'text-zinc-300 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>👤</span>
                        <div>
                          <div className="text-xs">Customer 4 (Buyer5)</div>
                          <div className="text-[9px] text-zinc-500 font-mono">VIP • 0 orders</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400">$1,250.00</span>
                    </button>

                    {/* Customer 5 */}
                    <button
                      type="button"
                      onClick={() => handleSwitchAccount('user_6@flashdrop.com', 'customer123')}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                        user.email === 'user_6@flashdrop.com' ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-800/50' : 'text-zinc-300 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>👤</span>
                        <div>
                          <div className="text-xs">Customer 5 (Buyer6)</div>
                          <div className="text-[9px] text-zinc-500 font-mono">1 order • Budget</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400">$55.00</span>
                    </button>
                  </div>
                )}

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
