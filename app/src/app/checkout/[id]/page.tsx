'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const dropId = params.id;
  const router = useRouter();

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
      <div className="max-w-md mx-auto p-8 rounded-2xl bg-zinc-900 border border-emerald-500/40 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl mx-auto border border-emerald-500/40">
          ✓
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Order Confirmed!</h2>
          <p className="text-xs text-zinc-400">Transaction completed inside MySQL stored procedure.</p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 text-left font-mono text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-zinc-500">Order ID:</span>
            <span className="text-white font-bold">#{orderResult.orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Status Code:</span>
            <span className="text-emerald-400 font-bold">{orderResult.code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Ledger Entry:</span>
            <span className="text-zinc-300">DEBIT Recorded</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Redis Hold:</span>
            <span className="text-zinc-300">Cleaned & Converted</span>
          </div>
        </div>

        <Link
          href="/wallet"
          className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs block transition"
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
      <div className={`p-4 rounded-xl border transition-all ${
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
        <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${isExpiring ? 'bg-rose-500' : 'bg-emerald-500'}`}
            style={{ width: `${(timeLeft / 300) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Checkout Order Card */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-8 space-y-6 shadow-xl">
        <h2 className="text-xl font-bold text-white tracking-tight border-b border-zinc-800 pb-4">
          Checkout & Order Allocation
        </h2>

        {/* Order Item */}
        <div className="flex items-center justify-between text-sm py-2">
          <div>
            <span className="font-bold text-white block">{drop?.drop_title}</span>
            <span className="text-xs text-zinc-400">Qty: 1 pair &bull; SKU: {drop?.sku}</span>
          </div>
          <span className="font-mono font-black text-white">${drop?.drop_price}</span>
        </div>

        {/* Payment Balance Box */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Payment Method:</span>
            <span className="text-emerald-400 font-bold uppercase">Prepaid Wallet</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Available Balance:</span>
            <span className="text-white font-mono font-bold">${wallet?.balance || '0.00'}</span>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-800/80 pt-2 text-zinc-400">
            <span>Balance After Order:</span>
            <span className="text-zinc-300 font-mono">
              ${(Number(wallet?.balance || 0) - Number(drop?.drop_price || 0)).toFixed(2)}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Submit Order Button */}
        <button
          onClick={handleConfirmOrder}
          disabled={processing || timeLeft === 0}
          className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold text-sm tracking-wide transition shadow-lg shadow-emerald-600/20"
        >
          {processing ? 'Executing Stored Procedure (sp_place_order)...' : 'Confirm Purchase ($' + drop?.drop_price + ')'}
        </button>

        <p className="text-[11px] text-zinc-500 text-center">
          Executes inside an atomic MySQL transaction. Inventory decremented, wallet debited, and double-entry ledger created simultaneously.
        </p>
      </div>
    </div>
  );
}
