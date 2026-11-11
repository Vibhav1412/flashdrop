'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StorefrontPage() {
  const [drops, setDrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ hours: 1, minutes: 24, seconds: 45 });

  useEffect(() => {
    fetch('/api/drops')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDrops(data.drops);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Live countdown timer ticker
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Section: Live Flash Drop Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/60 via-zinc-900 to-zinc-900 border border-rose-900/40 p-8 sm:p-12 shadow-2xl">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>Live Flash Drop Contention Window</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Aero Phantom Retro High <span className="text-rose-500">"Chicago OG"</span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Ultra-limited drop featuring premium varsity red tumbled leather. Protected by Redis in-memory atomic reservation locks and MySQL BCNF transactional accounting.
          </p>

          {/* Synchronized Drop Countdown Clock */}
          <div className="flex items-center space-x-4 pt-2">
            <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-zinc-950/80 border border-zinc-800 text-white font-mono font-bold text-xl">
              <span>{String(countdown.hours).padStart(2, '0')}</span>
              <span className="text-[10px] text-zinc-400 font-sans font-normal uppercase">Hours</span>
            </div>
            <span className="text-xl font-bold text-zinc-600">:</span>
            <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-zinc-950/80 border border-zinc-800 text-white font-mono font-bold text-xl">
              <span>{String(countdown.minutes).padStart(2, '0')}</span>
              <span className="text-[10px] text-zinc-400 font-sans font-normal uppercase">Mins</span>
            </div>
            <span className="text-xl font-bold text-zinc-600">:</span>
            <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-zinc-950/80 border border-rose-500/40 text-rose-400 font-mono font-bold text-xl shadow-lg shadow-rose-950/50">
              <span>{String(countdown.seconds).padStart(2, '0')}</span>
              <span className="text-[10px] text-rose-300 font-sans font-normal uppercase">Secs</span>
            </div>
          </div>

          <div className="pt-4 flex items-center space-x-4">
            <Link
              href="/drops/1"
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm tracking-wide transition shadow-lg shadow-rose-600/30 inline-flex items-center space-x-2"
            >
              <span>Enter Waiting Room</span>
              <span>&rarr;</span>
            </Link>
            <span className="text-xs text-zinc-400">Zero Oversell Guarantee via Redis Lua</span>
          </div>
        </div>
      </section>

      {/* Drops Grid Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Active & Upcoming Catalog</h2>
            <p className="text-xs text-zinc-400 mt-1">Queried from MySQL View: <code className="text-rose-400 font-mono">vw_live_drop_catalog</code></p>
          </div>
          <span className="text-xs px-3 py-1 rounded bg-zinc-800 text-zinc-300 font-mono">
            {drops.length} Drops Discovered
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-500 font-mono text-sm animate-pulse">
            Loading live drops from MySQL & Redis...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drops.map((drop) => (
              <div 
                key={drop.drop_id}
                className="group rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-6 flex flex-col justify-between transition hover:shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {drop.category_name}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      drop.stock_urgency_badge === 'AVAILABLE' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {drop.stock_urgency_badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-white group-hover:text-rose-400 transition">
                    {drop.drop_title}
                  </h3>

                  <p className="text-xs text-zinc-400 line-clamp-2">
                    SKU: <span className="font-mono text-zinc-300">{drop.sku}</span> &bull; Status: <span className="uppercase font-semibold text-zinc-300">{drop.drop_status}</span>
                  </p>
                </div>

                <div className="pt-6 border-t border-zinc-800/80 mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-zinc-400 block">Drop Price</span>
                    <span className="text-xl font-mono font-black text-white">${drop.drop_price}</span>
                  </div>

                  <Link
                    href={`/drops/${drop.drop_id}`}
                    className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition"
                  >
                    View Drop &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

