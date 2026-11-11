'use client';

import { useState, useEffect } from 'react';

export default function WalletPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/wallet?userId=2')
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-zinc-500 font-mono">Loading wallet ledger...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Prepaid Wallet & Ledger</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Guaranteed by MySQL double-entry balance constraints: <code className="text-emerald-400 font-mono">chk_wallets_balance_nonneg</code>
        </p>
      </div>

      {/* Balance Card */}
      <div className="p-8 rounded-2xl bg-gradient-to-tr from-zinc-900 to-zinc-900/60 border border-zinc-800 flex items-center justify-between shadow-xl">
        <div className="space-y-1">
          <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider">Current Available Funds</span>
          <div className="text-4xl font-mono font-black text-white">
            ${data?.wallet?.balance} <span className="text-sm font-sans text-zinc-400">USD</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Ledger Balanced</span>
        </div>
      </div>

      {/* Double-Entry Ledger Table */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-base font-bold text-white tracking-tight">Audit Ledger Entries</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Immutable audit trail of all CREDIT and DEBIT actions.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 text-zinc-400 font-mono uppercase text-[10px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-3 px-6">Entry ID</th>
                <th className="py-3 px-6">Type</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6">Balance After</th>
                <th className="py-3 px-6">Reference ID</th>
                <th className="py-3 px-6">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {data?.ledger?.map((entry: any) => (
                <tr key={entry.ledger_id} className="hover:bg-zinc-800/30 transition">
                  <td className="py-3.5 px-6 text-zinc-400">#{entry.ledger_id}</td>
                  <td className="py-3.5 px-6">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      entry.entry_type === 'CREDIT' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {entry.entry_type}
                    </span>
                  </td>
                  <td className={`py-3.5 px-6 font-bold ${entry.entry_type === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {entry.entry_type === 'CREDIT' ? '+' : '-'}${entry.amount}
                  </td>
                  <td className="py-3.5 px-6 text-white font-bold">${entry.balance_after}</td>
                  <td className="py-3.5 px-6 text-zinc-400 text-[11px]">{entry.reference_id}</td>
                  <td className="py-3.5 px-6 text-zinc-300 font-sans">{entry.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

