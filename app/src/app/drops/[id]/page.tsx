'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DropDetailPage({ params }: { params: { id: string } }) {
  const dropId = params.id;
  const router = useRouter();

  const [drop, setDrop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [queuePos, setQueuePos] = useState<number | null>(null);
  const [holding, setHolding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  // Handler: Join Redis Waiting Room Sorted Set
  const handleJoinQueue = async () => {
    // Simulating queue entry
    setQueuePos(14);
  };

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
        router.push(`/checkout/${dropId}`);
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Product Visual & Attributes Display */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-8 space-y-6">
          <div className="h-64 rounded-xl bg-gradient-to-tr from-rose-950/40 via-zinc-950 to-zinc-800 flex items-center justify-center text-7xl select-none">
            👟
          </div>

          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-zinc-400 tracking-wider">Product Attributes (Stored in MySQL JSON)</h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {Object.entries(attrs).map(([key, val]) => (
                <div key={key} className="p-2.5 rounded bg-zinc-950/60 border border-zinc-800">
                  <span className="text-zinc-400 block">{key}:</span>
                  <span className="text-white font-bold">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drop Details, Live Stock & Action Controls */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                Drop ID #{drop.drop_id}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {drop.drop_status.toUpperCase()}
              </span>
            </div>

            <h1 className="text-3xl font-black text-white">{drop.drop_title}</h1>
            <p className="text-2xl font-mono font-black text-rose-500">${drop.drop_price}</p>
          </div>

          {/* Real-Time Concurrency Status (Redis Stock Counter) */}
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Live Inventory (In-Memory Redis):</span>
              <span className="font-mono font-bold text-emerald-400 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{drop.live_stock} Units Remaining</span>
              </span>
            </div>

            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, drop.live_stock))}%` }}
              ></div>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleClaimHold}
              disabled={holding || drop.live_stock <= 0}
              className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition shadow-lg flex items-center justify-center space-x-2 ${
                drop.live_stock > 0
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {holding ? (
                <span>Executing Atomic Lua Reservation...</span>
              ) : drop.live_stock > 0 ? (
                <>
                  <span>Claim 5-Minute Checkout Hold</span>
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
