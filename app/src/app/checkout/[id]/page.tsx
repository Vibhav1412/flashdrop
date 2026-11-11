'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function CheckoutContent({ dropId }: { dropId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedSize = searchParams.get('size') || 'US 10.5';
  const selectedColorway = searchParams.get('colorway') || 'Chicago OG';
  const shoeImage = searchParams.get('image') || 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=85';

  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300 seconds)
  const [wallet, setWallet] = useState<any>(null);
  const [drop, setDrop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Fetch Drop and Wallet data
  useEffect(() => {
    Promise.all([
      fetch(`/api/drops/${dropId}`).then((r) => r.json()),
      fetch('/api/wallet?userId=2').then((r) => r.json()),
    ]).then(([dropData, walletData]) => {
      if (dropData.success) setDrop(dropData.drop);
      if (walletData.success) setWallet(walletData.wallet);
      setLoading(false);
    });

    // 2. Active 5-minute Hold Countdown Ticker
    const ticker = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(ticker);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, [dropId]);

  // Handler: Confirm Order via MySQL Stored Procedure
  const handleConfirmOrder = async () => {
    setProcessing(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 2,
          dropId: Number(dropId),
          paymentMethod: 'wallet',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrderResult(data);
      } else {
        setErrorMsg(data.message || 'Checkout failed.');
      }
    } catch (err: any) {
      setErrorMsg('Transaction failed to reach MySQL engine.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-zinc-500 font-mono">Securing checkout session...</div>;
  }

  // Order Confirmed State
  if (orderResult) {
    return (
      <div className="max-w-md mx-auto p-8 rounded-3xl bg-zinc-900 border border-emerald-500/50 text-center space-y-6 shadow-2xl">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-4xl mx-auto border-2 border-emerald-500/40">
          ✓
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tight">Order Confirmed!</h2>
          <p className="text-xs text-zinc-400">Transaction verified inside MySQL ACID stored procedure.</p>
        </div>

        {/* Confirmed Item Snapshot */}
        <div className="flex items-center space-x-3 p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-left">
          <img
            src={shoeImage}
            alt="Ordered Shoe"
            className="w-16 h-16 rounded-xl object-cover border border-zinc-800"
          />
          <div>
            <span className="font-bold text-white text-sm block">{drop?.drop_title}</span>
            <span className="text-xs font-mono text-rose-400 font-bold block">{selectedColorway} &bull; {selectedSize}</span>
            <span className="text-[11px] text-zinc-500">MSRP: ${drop?.drop_price}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-left font-mono text-xs space-y-2.5">
          <div className="flex justify-between">
            <span className="text-zinc-500">Order ID:</span>
            <span className="text-white font-bold">#{orderResult.orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Engine Status:</span>
            <span className="text-emerald-400 font-bold">{orderResult.code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Ledger Entry:</span>
            <span className="text-emerald-400">DEBIT Recorded (Balanced)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Redis Hold:</span>
            <span className="text-zinc-300">Cleaned & Restituted</span>
          </div>
        </div>

        <Link
          href="/wallet"
          className="w-full py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs block transition"
        >
          View Updated Wallet & Ledger &rarr;
        </Link>
      </div>
    );
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isExpiring = timeLeft <= 60;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* 5-Minute Hold Countdown Bar */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isExpiring 
          ? 'bg-rose-950/80 border-rose-600 animate-pulse' 
          : 'bg-zinc-900 border-zinc-800'
      }`}>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-300 font-medium flex items-center space-x-1.5">
            <span>⏱️</span>
            <span>Temporary Payment Hold (Redis TTL):</span>
          </span>
          <span className={`font-mono font-bold text-base ${isExpiring ? 'text-rose-400' : 'text-emerald-400'}`}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${isExpiring ? 'bg-rose-500' : 'bg-emerald-500'}`}
            style={{ width: `${(timeLeft / 300) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Checkout Order Card */}
      <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 space-y-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white tracking-tight border-b border-zinc-800 pb-4">
          Checkout & Order Allocation
        </h2>

        {/* Selected Product Card */}
        <div className="flex items-center space-x-4 p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800">
          <img
            src={shoeImage}
            alt={drop?.drop_title}
            className="w-20 h-20 rounded-xl object-cover border border-zinc-800 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <span className="font-bold text-white text-base block truncate">{drop?.drop_title}</span>
            <div className="flex items-center space-x-2 pt-1">
              <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono font-bold">
                {selectedSize}
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-mono">
                {selectedColorway}
              </span>
            </div>
            <span className="text-xs text-zinc-500 block pt-1 font-mono">SKU: {drop?.sku} &bull; Qty: 1 pair</span>
          </div>
          <div className="text-right shrink-0">
            <span className="font-mono font-black text-xl text-white">${drop?.drop_price}</span>
          </div>
        </div>

        {/* Payment Balance Box */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Payment Method:</span>
            <span className="text-emerald-400 font-bold uppercase flex items-center space-x-1">
              <span>💳</span>
              <span>Prepaid Wallet</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Available Wallet Balance:</span>
            <span className="text-white font-mono font-bold">${wallet?.balance || '0.00'}</span>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-800/80 pt-2 text-zinc-400">
            <span>Balance After Order:</span>
            <span className="text-zinc-300 font-mono font-bold">
              ${(Number(wallet?.balance || 0) - Number(drop?.drop_price || 0)).toFixed(2)}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Submit Order Button */}
        <button
          onClick={handleConfirmOrder}
          disabled={processing || timeLeft === 0}
          className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold text-sm tracking-wide transition shadow-xl shadow-emerald-600/30 hover:scale-[1.01]"
        >
          {processing ? 'Executing Stored Procedure (sp_place_order)...' : `Confirm Purchase for ${selectedSize} ($${drop?.drop_price})`}
        </button>

        <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
          Executes inside an atomic MySQL transaction (<code className="text-zinc-400">sp_place_order</code>). Inventory decremented, wallet debited, and double-entry ledger created simultaneously.
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="p-12 text-center text-zinc-500 font-mono">Securing checkout session...</div>}>
      <CheckoutContent dropId={params.id} />
    </Suspense>
  );
}
