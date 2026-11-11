'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminSqlConsolePage() {
  const [presets, setPresets] = useState<any[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('recursive_category_tree');
  const [customSql, setCustomSql] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [executing, setExecuting] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    fetch('/api/admin/queries')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPresets(data.presets);
          if (data.presets.length > 0) {
            setSelectedKey(data.presets[0].key);
            setCustomSql(data.presets[0].sql);
          }
        }
      });
  }, []);

  const activePreset = presets.find((p) => p.key === selectedKey);

  const handleSelectPreset = (key: string) => {
    setSelectedKey(key);
    setIsCustom(false);
    setErrorMsg('');
    const found = presets.find((p) => p.key === key);
    if (found) {
      setCustomSql(found.sql);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    setErrorMsg('');
    setResult(null);

    const sqlToRun = isCustom ? customSql : (activePreset?.sql || customSql);

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

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <span>Academic Showcase: Components 7 & 8</span>
          </div>
          <h1 className="text-3xl font-black text-white">Interactive MySQL 8 Query Console</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Execute production recursive CTEs, window functions, and views live against your local MySQL 8 engine.
          </p>
        </div>

        <button
          onClick={handleExecute}
          disabled={executing}
          className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white font-bold text-sm tracking-wide transition shadow-xl shadow-emerald-600/30 flex items-center space-x-2 shrink-0 hover:scale-[1.02]"
        >
          <span>{executing ? '⏳' : '▶'}</span>
          <span>{executing ? 'Executing on MySQL 8...' : 'Run Query on MySQL'}</span>
        </button>
      </div>

      {/* Query Selector Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar: Query Presets Menu */}
        <div className="lg:col-span-4 space-y-3">
          <label className="text-xs uppercase font-bold text-zinc-400 tracking-wider block">
            Select Evaluation Query (Component 7 & 8):
          </label>
          <div className="space-y-2">
            {presets.map((preset) => {
              const isSelected = selectedKey === preset.key && !isCustom;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handleSelectPreset(preset.key)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all ${
                    isSelected
                      ? 'bg-rose-950/30 border-rose-500 text-white shadow-md shadow-rose-950/50'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <span className="block font-bold text-sm mb-1">{preset.title}</span>
                  <span className="text-[10px] font-mono text-rose-400 block">{preset.category}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all ${
                isCustom
                  ? 'bg-emerald-950/30 border-emerald-500 text-white shadow-md'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <span className="block font-bold text-sm mb-1">✍️ Custom SQL Query</span>
              <span className="text-[10px] font-mono text-emerald-400 block">Ad-hoc SELECT sandbox</span>
            </button>
          </div>
        </div>

        {/* Right Area: SQL Editor & Output */}
        <div className="lg:col-span-8 space-y-6">
          {/* Query Description Card */}
          {!isCustom && activePreset && (
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{activePreset.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-rose-400">
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
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                <span>MySQL 8.0 Query Syntax (InnoDB)</span>
              </span>
              <span className="text-[11px] font-mono text-zinc-500">Read-Only Safety Guard Enabled</span>
            </div>

            {isCustom ? (
              <textarea
                value={customSql}
                onChange={(e) => setCustomSql(e.target.value)}
                placeholder="Type your SELECT query here..."
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
    </div>
  );
}

