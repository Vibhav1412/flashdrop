'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const DROP_IMAGES: Record<number, string> = {
  1: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
  2: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
  3: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
  4: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
  5: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80',
};

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
      {/* Hero Section: Live Flash Drop Showcase */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950/70 via-zinc-950 to-zinc-900 border border-rose-900/50 p-8 sm:p-12 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Hero Details & Countdown */}
          <div className="lg:col-span-7 space-y-6">
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

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                href="/drops/1"
                className="px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm tracking-wide transition shadow-lg shadow-rose-600/40 inline-flex items-center space-x-2 group"
              >
                <span>Enter Waiting Room</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </Link>
              <span className="text-xs text-zinc-400 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Zero Oversell Guarantee via Redis Lua</span>
              </span>
            </div>
          </div>

          {/* Right Column: Hero Sneaker Visual Showcase */}
          <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full transform scale-75 pointer-events-none"></div>
            <Link href="/drops/1" className="relative group block w-full max-w-sm">
              <div className="relative p-4 rounded-3xl bg-zinc-950/70 border border-rose-500/30 backdrop-blur-md overflow-hidden transition-all duration-500 group-hover:border-rose-500/70 group-hover:scale-105 shadow-2xl shadow-rose-950/40">
                <img
                  src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85"
                  alt="Aero Phantom Retro High Chicago OG"
                  className="w-full h-64 sm:h-72 object-cover rounded-2xl drop-shadow-[0_20px_35px_rgba(225,29,72,0.3)] transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-6 left-6">
                  <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-[10px] font-mono font-black uppercase tracking-widest shadow-md">
                    Chicago OG Edition
                  </span>
                </div>
                <div className="absolute bottom-6 right-6">
                  <span className="px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-700 text-zinc-200 text-xs font-mono font-bold shadow-md">
                    $220.00 &bull; US 10.5
                  </span>
                </div>
              </div>
            </Link>
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
                className="group rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-5 flex flex-col justify-between transition hover:shadow-xl"
              >
                <div>
                  {/* Card Thumbnail Image */}
                  <div className="relative h-44 rounded-xl overflow-hidden bg-zinc-950 mb-4 border border-zinc-800/80 group-hover:border-rose-500/30 transition">
                    <img
                      src={DROP_IMAGES[drop.drop_id] || 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80'}
                      alt={drop.drop_title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2.5 right-2.5">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md ${
                        drop.stock_urgency_badge === 'AVAILABLE' 
                          ? 'bg-emerald-500/90 text-white' 
                          : 'bg-rose-500/90 text-white'
                      }`}>
                        {drop.stock_urgency_badge}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {drop.category_name}
                    </span>

                    <h3 className="font-bold text-lg text-white group-hover:text-rose-400 transition">
                      {drop.drop_title}
                    </h3>

                    <p className="text-xs text-zinc-400">
                      SKU: <span className="font-mono text-zinc-300">{drop.sku}</span> &bull; Status: <span className="uppercase font-semibold text-zinc-300">{drop.drop_status}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-5 border-t border-zinc-800/80 mt-5 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-zinc-400 block">Drop Price</span>
                    <span className="text-xl font-mono font-black text-white">${drop.drop_price}</span>
                  </div>

                  <Link
                    href={`/drops/${drop.drop_id}`}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-rose-600 hover:text-white text-zinc-200 text-xs font-semibold transition"
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
