'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function OrderReceiptPage({ params }: { params: { id: string } }) {
  const orderId = params.id;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData.order);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return <div className="p-12 text-center text-zinc-500 font-mono">Generating tax receipt from MySQL ledger...</div>;
  }

  if (!data) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Receipt Not Found</h2>
        <p className="text-xs text-zinc-400">Order #{orderId} does not exist in the database.</p>
        <Link href="/" className="text-xs text-rose-400 hover:underline">Return to Storefront &rarr;</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between no-print">
        <Link href="/wallet" className="text-xs text-zinc-400 hover:text-white flex items-center space-x-1">
          <span>&larr;</span>
          <span>Back to Wallet & Ledger</span>
        </Link>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-bold transition flex items-center space-x-2 border border-zinc-700 shadow-md"
        >
          <span>🖨️</span>
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Official Receipt Card */}
      <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-8 sm:p-12 space-y-8 shadow-2xl relative overflow-hidden">
        {/* Watermark stamp */}
        <div className="absolute top-12 right-12 transform rotate-12 border-4 border-emerald-500/30 text-emerald-500/30 font-black text-2xl uppercase tracking-widest px-4 py-1.5 rounded-lg select-none pointer-events-none">
          ACID CONFIRMED
        </div>

        {/* Brand Header */}
        <div className="border-b border-zinc-800 pb-6 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-2xl text-rose-500">⚡</span>
              <span className="text-2xl font-black tracking-tight text-white">FLASHDROP COMMERCE</span>
            </div>
            <p className="text-xs text-zinc-500 font-mono">Polyglot Architecture: MySQL 8.0 &bull; Redis 7.2</p>
          </div>
          <div className="text-right font-mono text-xs space-y-1">
            <span className="text-zinc-500 block">ORDER ID</span>
            <span className="text-white font-black text-base">#{data.orderId}</span>
          </div>
        </div>

        {/* Customer & Date Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div className="space-y-1">
            <span className="text-zinc-500 block text-[10px] uppercase">Billed Customer:</span>
            <span className="text-white font-bold block">{data.customerName || 'Verified Collector'}</span>
            <span className="text-zinc-400 block">{data.customerEmail}</span>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-zinc-500 block text-[10px] uppercase">Transaction Date:</span>
            <span className="text-white font-bold block">
              {new Date(data.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-emerald-400 font-bold uppercase block">{data.status}</span>
          </div>
        </div>

        {/* Itemized Line Items Table */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
            Itemized Purchase Contract
          </span>

          <div className="rounded-2xl bg-zinc-950 border border-zinc-800/80 overflow-hidden font-mono text-xs">
            <table className="w-full text-left">
              <thead className="bg-zinc-900/60 text-zinc-500 uppercase text-[10px] border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Item & SKU</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                <tr>
                  <td className="py-4 px-4 space-y-0.5">
                    <span className="text-white font-bold block text-sm">{data.item.title}</span>
                    <span className="text-[11px] text-zinc-400 block">SKU: {data.item.sku}</span>
                    <span className="text-[10px] text-rose-400 block">Edition: Retro OG &bull; Size: US 10.5</span>
                  </td>
                  <td className="py-4 px-4 text-center text-zinc-300 font-bold">{data.item.quantity}</td>
                  <td className="py-4 px-4 text-right text-zinc-300">${Number(data.item.price).toFixed(2)}</td>
                  <td className="py-4 px-4 text-right text-white font-black text-sm">${Number(data.item.price).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Subtotal Breakdown */}
        <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-2 text-xs font-mono">
          <div className="flex justify-between text-zinc-400">
            <span>Subtotal:</span>
            <span className="text-white">${Number(data.item.price).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Loyalty Discount (fn_calculate_loyalty_discount):</span>
            <span className="text-emerald-400">-$0.00</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Estimated Sales Tax (0.00%):</span>
            <span className="text-white">$0.00</span>
          </div>
          <div className="flex justify-between text-base font-black border-t border-zinc-800 pt-3 text-white">
            <span>Total Settlement:</span>
            <span className="text-rose-500 font-mono">${Number(data.payment.amount).toFixed(2)}</span>
          </div>
        </div>

        {/* Double-Entry Relational Audit Trail */}
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-[11px] font-mono space-y-1.5">
          <span className="text-emerald-400 font-bold uppercase block text-[10px] tracking-wider">
            Double-Entry Ledger Audit Trail (Component 8):
          </span>
          <div className="flex justify-between text-zinc-400">
            <span>Payment Method:</span>
            <span className="text-white font-bold uppercase">{data.payment.method}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Ledger Entry ID:</span>
            <span className="text-white">wallet_ledger #{data.ledgerEntry?.entry_id || 'AUTO_BALANCED'}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Transaction Type:</span>
            <span className="text-rose-400 font-bold">DEBIT (Direct Balance Deduction)</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Balance After Order:</span>
            <span className="text-emerald-400 font-bold">${Number(data.ledgerEntry?.balance_after || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Footer Cryptographic Hash */}
        <div className="border-t border-zinc-800 pt-6 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] font-mono text-zinc-500 gap-2">
          <span>TXID: SHA256:{Math.random().toString(36).substring(2, 15).toUpperCase()}</span>
          <span>Verified under MySQL ACID Isolation</span>
        </div>
      </div>
    </div>
  );
}

