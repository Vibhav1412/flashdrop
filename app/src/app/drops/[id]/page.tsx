'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SIZES = ['US 8.0', 'US 8.5', 'US 9.0', 'US 9.5', 'US 10.0', 'US 10.5', 'US 11.0', 'US 11.5', 'US 12.0'];

const COLORWAYS: Record<string, { name: string; label: string; primary: string; secondary: string; image: string }> = {
  'chicago': {
    name: 'Chicago OG',
    label: 'Varsity Red / Black / White',
    primary: '#DC2626',
    secondary: '#000000',
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85',
  },
  'shadow': {
    name: 'Shadow Noir',
    label: 'Stealth Grey / Dark Noir',
    primary: '#3F3F46',
    secondary: '#18181B',
    image: 'https://images.unsplash.com/photo-1622920883841-5bf72e392d8f?auto=format&fit=crop&w=1000&q=85',
  },
  'royal': {
    name: 'Royal Obsidian',
    label: 'Deep Obsidian / Summit White',
    primary: '#2563EB',
    secondary: '#F8FAFC',
    image: 'https://images.unsplash.com/photo-1620794317321-bfd90092d065?auto=format&fit=crop&w=1000&q=85',
  },
  'mocha': {
    name: 'Travis Mocha',
    label: 'Rich Earth / Vintage Sail',
    primary: '#78350F',
    secondary: '#F59E0B',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=85',
  },
};

export default function DropDetailPage({ params }: { params: { id: string } }) {
  const dropId = params.id;
  const router = useRouter();

  const [drop, setDrop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [queuePos, setQueuePos] = useState<number | null>(null);
  const [holding, setHolding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Interactive Size and Colorway selection
  const [selectedSize, setSelectedSize] = useState('US 10.5');
  const [selectedColorKey, setSelectedColorKey] = useState('chicago');

  const activeColor = COLORWAYS[selectedColorKey] || COLORWAYS['chicago'];

  // Fetch drop details and live Redis stock
  useEffect(() => {
    fetch(`/api/drops/${dropId}?userId=2`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDrop(data.drop);
          setQueuePos(data.drop.queue_position);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dropId]);

  // Handler: Atomic Lua Hold Acquisition
  const handleClaimHold = async () => {
    setHolding(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/drops/${dropId}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 2, ttlSeconds: 300 }),
      });
      const data = await res.json();

      if (data.success) {
        // Redirect directly to checkout with active 5-minute hold!
        router.push(
          `/checkout/${dropId}?size=${encodeURIComponent(selectedSize)}&colorway=${encodeURIComponent(activeColor.name)}&image=${encodeURIComponent(activeColor.image)}`
        );
      } else {
        setErrorMsg(data.message || 'Failed to acquire checkout hold.');
      }
    } catch (err: any) {
      setErrorMsg('Network error connecting to Redis layer.');
    } finally {
      setHolding(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-zinc-500 font-mono">Loading drop details...</div>;
  }

  if (!drop) {
    return <div className="p-12 text-center text-rose-500 font-bold">Drop not found.</div>;
  }

  // Parse JSON attributes safely
  let attrs: any = {};
  try {
    attrs = typeof drop.attributes_json === 'string' 
      ? JSON.parse(drop.attributes_json) 
      : (drop.attributes_json || {});
  } catch (e) {
    attrs = {};
  }

  // Dynamic live attributes reflecting interactive selections
  const dynamicAttrs = {
    ...attrs,
    size: selectedSize,
    colorway: activeColor.label,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs font-mono text-zinc-500">
        <Link href="/" className="hover:text-zinc-300 transition">Storefront</Link>
        <span>/</span>
        <span className="text-zinc-400">Drops</span>
        <span>/</span>
        <span className="text-rose-400 font-bold">#{drop.drop_id}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 Cols): Product Showcase Visual & JSON Attributes */}
        <div className="lg:col-span-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Main Sneaker Imagery Showcase */}
          <div className="relative h-72 sm:h-84 rounded-2xl bg-zinc-950 overflow-hidden border border-zinc-800 flex items-center justify-center group">
            <div 
              className="absolute inset-0 opacity-25 blur-2xl transition-all duration-700 pointer-events-none"
              style={{ backgroundColor: activeColor.primary }}
            ></div>

            <img
              src={activeColor.image}
              alt={activeColor.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 drop-shadow-2xl"
            />

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex flex-col space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-700 text-white text-[11px] font-mono font-bold uppercase tracking-wider backdrop-blur-md">
                {activeColor.name}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-600/90 text-white text-[10px] font-mono font-black uppercase tracking-widest backdrop-blur-md">
                {selectedSize}
              </span>
            </div>

            <div className="absolute bottom-4 right-4">
              <span className="px-2.5 py-1 rounded-lg bg-zinc-950/80 border border-zinc-800 text-[10px] font-mono text-zinc-400 backdrop-blur-md">
                360° Studio Photography
              </span>
            </div>
          </div>

          {/* MySQL JSON Attributes Inspector */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase font-bold text-zinc-400 tracking-wider">
                Product Attributes (Stored in MySQL JSON)
              </h4>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                Live Dynamic Binding
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {Object.entries(dynamicAttrs).map(([key, val]) => (
                <div key={key} className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px] uppercase">{key}:</span>
                  <span className="text-white font-bold truncate block">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (6 Cols): Sizing, Colorway Selection, Stock Bar & Checkout Hold Button */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-800 text-zinc-400">
                Drop ID #{drop.drop_id}
              </span>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                {drop.drop_status.toUpperCase()}
              </span>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                100% AUTHENTIC
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{drop.drop_title}</h1>
            <p className="text-3xl font-mono font-black text-rose-500 pt-1">${drop.drop_price}</p>
          </div>

          {/* Real-Time Concurrency Status (Redis Stock Counter) */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Live Inventory (In-Memory Redis):</span>
              <span className="font-mono font-bold text-emerald-400 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{drop.live_stock} Units Remaining</span>
              </span>
            </div>

            <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, drop.live_stock))}%` }}
              ></div>
            </div>
          </div>

          {/* Interactive Colorway Selector */}
          <div className="space-y-3 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Select Colorway:
              </label>
              <span className="text-xs font-mono text-rose-400 font-bold">{activeColor.name}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(COLORWAYS).map(([key, c]) => {
                const isSelected = selectedColorKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedColorKey(key)}
                    className={`p-3 rounded-xl border flex flex-col items-center space-y-2 transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-rose-950/20 shadow-md shadow-rose-950/40 scale-105'
                        : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: c.primary }}></span>
                      <span className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: c.secondary }}></span>
                    </div>
                    <span className={`text-[11px] font-bold truncate max-w-full ${isSelected ? 'text-rose-400' : 'text-zinc-400'}`}>
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Shoe Size Selector */}
          <div className="space-y-3 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Select Shoe Size (US Men):
              </label>
              <span className="text-xs font-mono text-rose-400 font-bold">{selectedSize}</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {SIZES.map((size) => {
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-mono font-bold transition-all ${
                      isSelected
                        ? 'bg-rose-600 text-white border border-rose-500 shadow-md shadow-rose-600/30 scale-105'
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleClaimHold}
              disabled={holding || drop.live_stock <= 0}
              className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition shadow-xl flex items-center justify-center space-x-2 ${
                drop.live_stock > 0
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 hover:scale-[1.01]'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {holding ? (
                <span>Executing Atomic Lua Reservation...</span>
              ) : drop.live_stock > 0 ? (
                <>
                  <span>Claim 5-Minute Checkout Hold for {selectedSize}</span>
                  <span>⚡</span>
                </>
              ) : (
                <span>SOLD OUT</span>
              )}
            </button>

            <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
              Clicking triggers <code className="text-rose-400 font-mono">acquire_hold.lua</code> in Redis. Stock is reserved exclusively for you for 300 seconds. Zero overselling guarantee.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
