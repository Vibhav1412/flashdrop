'use client';

export default function ReferralsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Viral Referral Network</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Queried using MySQL 8 Recursive Common Table Expression (<code className="text-rose-400 font-mono">WITH RECURSIVE ReferralTree</code>)
        </p>
      </div>

      {/* Referral Link & Share Box */}
      <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-xl">
        <h2 className="text-sm uppercase font-bold text-zinc-400 tracking-wider">Your Personal Referral Link</h2>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            readOnly
            value="https://flashdrop.local/join?ref=REF-0002"
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 font-mono text-xs text-zinc-300 focus:outline-none"
          />
          <button 
            onClick={() => alert('Referral link copied!')}
            className="px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition"
          >
            Copy Link
          </button>
        </div>
        <p className="text-xs text-zinc-500">
          Earn $25 credit on your wallet for every successful drop purchase made by your referred friends.
        </p>
      </div>

      {/* Recursive Lineage Tree Visualization */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-8 space-y-6 shadow-xl">
        <h2 className="text-base font-bold text-white tracking-tight">Referral Lineage Graph (Recursive Tree)</h2>
        <div className="space-y-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-rose-400 font-bold">
              <span>Viral Level 1 (Direct Referee)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">REWARDED</span>
            </div>
            <p className="text-zinc-300">User 2 (You) &rarr; User 3 (Buyer3 Customer3)</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 ml-6 border-l-2 border-l-rose-500">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span>Viral Level 2 (Sub-tier Referral)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">QUALIFIED</span>
            </div>
            <p className="text-zinc-300">User 3 &rarr; User 4 (Buyer4 Customer4)</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 ml-12 border-l-2 border-l-emerald-500">
            <div className="flex items-center justify-between text-blue-400 font-bold">
              <span>Viral Level 3 (Deep Branch)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">QUALIFIED</span>
            </div>
            <p className="text-zinc-300">User 4 &rarr; User 5 (Buyer5 Customer5)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
