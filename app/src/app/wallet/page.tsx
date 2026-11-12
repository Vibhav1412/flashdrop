'use client';

import { useState, useEffect } from 'react';

export default function WalletPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchWallet = () => {
    fetch('/api/wallet?userId=2')
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleDeposit = async (amount: number) => {
    setDepositing(true);
    setToastMessage(null);
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 2, amount }),
      });
      const result = await res.json();
      if (result.success) {
        setData({ wallet: result.wallet, ledger: result.ledger });
        setToastMessage(`+$${amount.toFixed(2)} USD credited via sp_deposit_wallet`);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        alert(result.error || 'Failed to deposit funds');
      }
    } catch {
      alert('Network error depositing funds');
    } finally {
      setDepositing(false);
    }
  };

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

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs flex items-center justify-between animate-fade-in shadow-lg">
          <div className="flex items-center space-x-2">
            <span>✅</span>
            <span>{toastMessage}</span>
          </div>
          <span className="text-[10px] text-zinc-400">ACID Transaction Committed</span>
        </div>
      )}

      {/* Balance & Quick Top-Up Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-tr from-zinc-900 via-zinc-900 to-zinc-900/60 border border-zinc-800 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider">Current Available Funds</span>
            <div className="text-4xl font-mono font-black text-white flex items-baseline space-x-2">
              <span>${Number(data?.wallet?.balance || 0).toFixed(2)}</span>
              <span className="text-sm font-sans text-zinc-400 font-normal">USD</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono px-3.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Ledger Balanced &bull; User #2</span>
          </div>
        </div>

        {/* Quick Deposit Actions */}
        <div className="pt-4 border-t border-zinc-800/80 space-y-2.5">
          <span className="text-xs font-mono text-zinc-400 block font-semibold uppercase tracking-wider">
            ⚡ Quick Balance Top-Up (Direct Stored Procedure Deposit):
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            {[100, 250, 500, 1000].map((amt) => (
              <button
                key={amt}
                onClick={() => handleDeposit(amt)}
                disabled={depositing}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-mono text-xs font-bold transition border border-zinc-700/80 disabled:opacity-50 hover:border-emerald-500/50 shadow-sm"
              >
                + ${amt}
              </button>
            ))}
            {depositing && (
              <span className="text-xs font-mono text-emerald-400 animate-pulse ml-2">
                Executing sp_deposit_wallet...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Double-Entry Ledger Table */}
      <div className="rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Audit Ledger Entries</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Immutable audit trail of all CREDIT and DEBIT actions in MySQL.</p>
          </div>
          <button
            onClick={fetchWallet}
            className="text-xs text-zinc-400 hover:text-white font-mono flex items-center space-x-1 border border-zinc-800 px-3 py-1 rounded-lg hover:border-zinc-700"
          >
            <span>↻ Refresh</span>
          </button>
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
