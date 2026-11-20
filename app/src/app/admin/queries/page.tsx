'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const QUICK_PROMPTS = [
  { label: '👑 Top 5 Buyers by Spend', prompt: 'Who are our top 5 buyers by total spending and order count?' },
  { label: '💰 Unspent Wallets with Zero Orders', prompt: 'Find all registered users with unspent wallet balances who have never placed an order.' },
  { label: '⚡ Drop Sellout Rates & GMV', prompt: 'Show all drops with their sellout percentage, inventory status, and total gross revenue.' },
  { label: '🚨 High-Risk Bot Accounts Flagged', prompt: 'Show all fraud flags with high risk scores and auto-suspended users.' },
  { label: '🌳 Recursive Category Breadcrumbs', prompt: 'Show the full recursive category tree with hierarchical breadcrumbs and nesting depth.' },
  { label: '👥 Viral Referral Tree Lineage', prompt: 'Show the viral referral network lineage starting from user 1 across tier depths.' },
  { label: '👟 Product Price History Audits', prompt: 'Show all products that had price changes with old price, new price, and auditor identity.' },
  { label: '📊 Detailed Order Billing Receipts', prompt: 'Show the most recent paid orders with customer name, drop title, and payment method.' },
  { label: '⏱️ Checkout Burst Latency (LAG)', prompt: 'Calculate the microsecond latency deltas between consecutive burst checkout attempts using window functions.' },
];

export default function AdminSqlConsolePage() {
  const [activeTab, setActiveTab] = useState<'ai' | 'presets' | 'custom'>('ai');
  const [presets, setPresets] = useState<any[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('recursive_category_tree');
  const [customSql, setCustomSql] = useState<string>('');
  const [executing, setExecuting] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [unauthorized, setUnauthorized] = useState<boolean>(false);

  // AI Assistant States
  const [aiPrompt, setAiPrompt] = useState<string>('Who are our top 5 buyers by total spending and order count?');
  const [aiResult, setAiResult] = useState<any>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated || data.user?.role !== 'admin') {
          setUnauthorized(true);
        } else {
          fetch('/api/admin/queries')
            .then((res) => res.json())
            .then((d) => {
              if (d.success) {
                setPresets(d.presets);
                if (d.presets.length > 0) {
                  setSelectedKey(d.presets[0].key);
                  setCustomSql(d.presets[0].sql);
                }
              }
            });
        }
      })
      .catch(() => setUnauthorized(true));
  }, []);

  const activePreset = presets.find((p) => p.key === selectedKey);

  // Execute Preset or Custom SQL
  const handleExecuteSql = async () => {
    setExecuting(true);
    setErrorMsg('');
    setResult(null);

    const sqlToRun = activeTab === 'custom' ? customSql : (activePreset?.sql || customSql);

    try {
      const res = await fetch('/api/admin/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlToRun }),
      });
      const data = await res.json();

      if (data.success) {
        setResult(data);
      } else {
        setErrorMsg(data.error || 'Query execution failed.');
      }
    } catch (err: any) {
      setErrorMsg('Network error connecting to MySQL execution endpoint.');
    } finally {
      setExecuting(false);
    }
  };

  // Execute Natural Language to SQL
  const handleExecuteAiPrompt = async (promptToRun?: string) => {
    const text = (promptToRun || aiPrompt).trim();
    if (!text) return;

    if (promptToRun) {
      setAiPrompt(promptToRun);
    }

    setExecuting(true);
    setErrorMsg('');
    setAiResult(null);

    try {
      const res = await fetch('/api/admin/ai-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();

      if (data.success) {
        setAiResult(data);
      } else {
        setErrorMsg(data.error || 'AI SQL generation failed.');
      }
    } catch (err: any) {
      setErrorMsg('Network error connecting to AI SQL synthesizer.');
    } finally {
      setExecuting(false);
    }
  };

  const handleCopySql = (sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleTransferToCustom = (sql: string) => {
    setCustomSql(sql);
    setActiveTab('custom');
    setResult(null);
    setErrorMsg('');
  };

  if (unauthorized) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-zinc-900 border border-rose-500/30 text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl mx-auto border border-rose-500/30">
          🔒
        </div>
        <h2 className="text-xl font-black text-white">Administrator Role Required</h2>
        <p className="text-xs text-zinc-400 font-mono">
          This query console executes analytics queries directly through <code className="text-rose-400">adminPool</code> with full operational privileges on MySQL 8.0.
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-rose-600/30"
          >
            Sign In with Admin Account &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <span>DBMS Academic Showcase: Components 7, 8 &amp; AI Integration</span>
          </div>
          <h1 className="text-3xl font-black text-white">Interactive MySQL 8 Query &amp; AI Console</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Query your 20-table MySQL 8 schema using plain English, predefined evaluation presets, or ad-hoc SQL.
          </p>
        </div>

        {/* Global Action Button */}
        {activeTab !== 'ai' && (
          <button
            onClick={handleExecuteSql}
            disabled={executing}
            className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white font-bold text-sm tracking-wide transition shadow-xl shadow-emerald-600/30 flex items-center space-x-2 shrink-0 hover:scale-[1.02]"
          >
            <span>{executing ? '⏳' : '▶'}</span>
            <span>{executing ? 'Executing on MySQL 8...' : 'Run Query on MySQL'}</span>
          </button>
        )}
      </div>

      {/* Main Mode Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-4">
        <button
          onClick={() => { setActiveTab('ai'); setErrorMsg(''); }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ai'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
          }`}
        >
          <span>🤖</span>
          <span>FlashDrop AI (Natural Language to SQL)</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/20 text-white font-mono uppercase">New</span>
        </button>

        <button
          onClick={() => { setActiveTab('presets'); setErrorMsg(''); }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'presets'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
          }`}
        >
          <span>📜</span>
          <span>Evaluation Query Presets (Components 7 &amp; 8)</span>
        </button>

        <button
          onClick={() => { setActiveTab('custom'); setErrorMsg(''); }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'custom'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
          }`}
        >
          <span>✍️</span>
          <span>Ad-Hoc SQL Sandbox</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: FLASHDROP AI ASSISTANT (NATURAL LANGUAGE TO SQL) */}
      {/* ========================================================================= */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          {/* Natural Language Prompt Input Bar */}
          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-rose-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center space-x-2 font-mono">
                <span>🤖</span>
                <span>Natural Language Intent Synthesizer</span>
              </span>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                🛡️ Read-Only Guard Enforced (Zero Mutations)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecuteAiPrompt()}
                placeholder="Ask any question in plain English (e.g., 'Who are our top 3 buyers by total spending?')..."
                className="flex-1 px-4 py-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-rose-500 font-mono"
              />
              <button
                onClick={() => handleExecuteAiPrompt()}
                disabled={executing}
                className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 text-white font-bold text-sm tracking-wide transition shadow-xl shadow-rose-600/30 flex items-center justify-center space-x-2 shrink-0 hover:scale-[1.02]"
              >
                <span>{executing ? '⏳' : '⚡'}</span>
                <span>{executing ? 'Synthesizing SQL...' : 'Ask FlashDrop AI'}</span>
              </button>
            </div>

            {/* Quick-Prompt Viva Chips */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/80">
              <span className="text-[11px] font-mono text-zinc-400 block font-bold">
                💡 Instant Viva Test Prompts (1-Click Query Synthesis):
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((qp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleExecuteAiPrompt(qp.prompt)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-rose-500/50 hover:bg-rose-950/20 text-zinc-300 hover:text-white text-xs font-mono transition text-left"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono">
              ❌ {errorMsg}
            </div>
          )}

          {/* AI Result Card */}
          {aiResult && (
            <div className="space-y-6 animate-fadeIn">
              {/* Synthesis Metadata Bar */}
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                      Target Intent:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-mono font-bold">
                      {aiResult.intent}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                      ⚡ Executed in {aiResult.durationMs} ms
                    </span>
                    <span className="text-zinc-400">
                      {aiResult.rowCount} row{aiResult.rowCount === 1 ? '' : 's'} returned
                    </span>
                  </div>
                </div>

                <div className="text-xs text-zinc-300 font-sans leading-relaxed">
                  <strong className="text-white">Explanation: </strong>
                  {aiResult.explanation}
                </div>
              </div>

              {/* Generated SQL Code Box */}
              <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800">
                  <span className="text-xs font-mono text-zinc-400 flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Synthesized MySQL 8.0 DML Query</span>
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopySql(aiResult.sql)}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-mono transition"
                    >
                      {copiedSql ? '✓ Copied!' : '📋 Copy SQL'}
                    </button>
                    <button
                      onClick={() => handleTransferToCustom(aiResult.sql)}
                      className="px-2.5 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-[11px] font-mono transition border border-purple-500/30"
                    >
                      ✏️ Edit in Sandbox
                    </button>
                  </div>
                </div>

                <pre className="p-4 overflow-x-auto text-xs font-mono text-emerald-300 leading-relaxed max-h-60 bg-black/60">
                  <code>{aiResult.sql}</code>
                </pre>
              </div>

              {/* Live MySQL Database Rows Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
                  <span>Live MySQL InnoDB Data Output:</span>
                  <span className="text-zinc-500">Source: flashdrop_admin_user @ 127.0.0.1:3306</span>
                </div>

                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider sticky top-0 border-b border-zinc-800">
                        <tr>
                          {aiResult.columns.map((col: string) => (
                            <th key={col} className="px-4 py-3">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {aiResult.rows.map((row: any, i: number) => (
                          <tr key={i} className="hover:bg-zinc-800/40 transition">
                            {aiResult.columns.map((col: string) => (
                              <td key={col} className="px-4 py-2.5 text-zinc-200 truncate max-w-xs">
                                {row[col] === null ? (
                                  <span className="text-zinc-600 italic">NULL</span>
                                ) : typeof row[col] === 'object' ? (
                                  JSON.stringify(row[col])
                                ) : (
                                  String(row[col])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2 & 3: EVALUATION PRESETS & AD-HOC CUSTOM SQL */}
      {/* ========================================================================= */}
      {activeTab !== 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar: Query Presets Menu */}
          <div className="lg:col-span-4 space-y-3">
            <label className="text-xs uppercase font-bold text-zinc-400 tracking-wider block">
              {activeTab === 'presets' ? 'Select Evaluation Query (Components 7 & 8):' : 'Custom Query Mode:'}
            </label>

            {activeTab === 'presets' ? (
              <div className="space-y-2">
                {presets.map((preset) => {
                  const isSelected = selectedKey === preset.key;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => {
                        setSelectedKey(preset.key);
                        setCustomSql(preset.sql);
                        setErrorMsg('');
                        setResult(null);
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      <span className="block font-bold text-sm mb-1">{preset.title}</span>
                      <span className="text-[10px] font-mono text-emerald-400 block">{preset.category}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400 space-y-2">
                <span className="font-bold text-white block">Ad-Hoc Query Sandbox</span>
                <p>Type any custom <code className="text-purple-400">SELECT</code> or <code className="text-purple-400">WITH</code> statement on the right.</p>
                <p className="text-[11px] text-zinc-500">Mutations are automatically blocked by the read-only safety shield.</p>
              </div>
            )}
          </div>

          {/* Right Area: SQL Editor & Output */}
          <div className="lg:col-span-8 space-y-6">
            {/* Query Description Card */}
            {activeTab === 'presets' && activePreset && (
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{activePreset.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-emerald-400">
                    {activePreset.category}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{activePreset.description}</p>
              </div>
            )}

            {/* SQL Editor / Code Block */}
            <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800">
                <span className="text-xs font-mono text-zinc-400 flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>MySQL 8.0 Query Syntax (InnoDB)</span>
                </span>
                <span className="text-[11px] font-mono text-zinc-500">Read-Only Safety Guard Enabled</span>
              </div>

              {activeTab === 'custom' ? (
                <textarea
                  value={customSql}
                  onChange={(e) => setCustomSql(e.target.value)}
                  placeholder="Type your SELECT or WITH query here..."
                  rows={8}
                  className="w-full p-4 bg-zinc-950 font-mono text-xs text-emerald-300 focus:outline-none resize-none leading-relaxed"
                />
              ) : (
                <pre className="p-4 overflow-x-auto text-xs font-mono text-zinc-200 leading-relaxed max-h-56">
                  <code>{activePreset?.sql}</code>
                </pre>
              )}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono">
                ❌ {errorMsg}
              </div>
            )}

            {/* Results Table */}
            {result && (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                      ⚡ {result.durationMs} ms
                    </span>
                    <span className="text-zinc-400">
                      {result.rowCount} row{result.rowCount === 1 ? '' : 's'} returned
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">Pool: adminPool (Least-Privilege)</span>
                </div>

                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider sticky top-0 border-b border-zinc-800">
                        <tr>
                          {result.columns.map((col: string) => (
                            <th key={col} className="px-4 py-3">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {result.rows.map((row: any, i: number) => (
                          <tr key={i} className="hover:bg-zinc-800/40 transition">
                            {result.columns.map((col: string) => (
                              <td key={col} className="px-4 py-2.5 text-zinc-200 truncate max-w-xs">
                                {row[col] === null ? (
                                  <span className="text-zinc-600 italic">NULL</span>
                                ) : typeof row[col] === 'object' ? (
                                  JSON.stringify(row[col])
                                ) : (
                                  String(row[col])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
