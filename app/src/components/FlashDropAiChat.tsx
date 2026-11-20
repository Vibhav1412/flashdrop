'use client';

// =====================================================================
// FLASHDROP: app/src/components/FlashDropAiChat.tsx
// Multi-Tenant Isolated Floating AI Assistant
// Completely separates chat history for Admin and each of the 5 Customers!
// =====================================================================

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  Bot,
  X,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Database,
  ShieldCheck,
  Minimize2,
  Maximize2,
  RotateCcw,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sql?: string;
  explanation?: string;
  rows?: any[];
  columns?: string[];
  durationMs?: number;
  timestamp: string;
  suggestedQuestions?: string[];
}

interface UserSession {
  userId: number;
  email: string;
  role: string;
  name: string;
}

function getAccountKey(u: UserSession | null): string {
  if (!u) return 'guest';
  if (u.role === 'admin') return 'admin';
  return `customer_${u.userId}`;
}

function getDefaultWelcomeMessage(u: UserSession | null): ChatMessage {
  const isAdmin = u?.role === 'admin';
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isAdmin) {
    return {
      id: 'welcome-admin',
      sender: 'assistant',
      text: `Welcome, Administrator **${u?.name || 'Admin'}**! I am your **FlashDrop Executive Intelligence** assistant. You have full analytical visibility over our MySQL 8.0 relational schema, inventory conservation metrics, bot security flags, and platform GMV.`,
      timestamp: time,
      suggestedQuestions: [
        'Who are our top 3 buyers by total spending?',
        'Which drop sold out the fastest?',
        'Check inventory conservation across all drops',
        'Show high-risk bot attack IPs and suspensions',
        'Show total platform revenue and paid orders',
      ],
    };
  }

  const customerName = u ? u.name.split(' ')[0] : 'Shopper';
  const customerId = u ? u.userId : 0;
  return {
    id: `welcome-cust-${customerId}`,
    sender: 'assistant',
    text: `Hi **${customerName}**! I'm your **FlashDrop Shopper Concierge**. How can I help you today with your orders, wallet balance, active drop reservations, or referral points?`,
    timestamp: time,
    suggestedQuestions: [
      'What is my wallet balance & recent transactions?',
      'What orders have I placed so far?',
      'Am I in any waiting room queue or hold?',
      'Which drops are live right now?',
      'Show my referral reward points',
    ],
  };
}

export default function FlashDropAiChat() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [expandedSqlId, setExpandedSqlId] = useState<string | null>(null);

  const [user, setUser] = useState<UserSession | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInChatSwitcher, setShowInChatSwitcher] = useState(false);

  // Multi-account isolated chat store (Keyed by: 'admin', 'customer_2', 'customer_3', etc.)
  const [historyByAccount, setHistoryByAccount] = useState<Record<string, ChatMessage[]>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Load saved conversation histories from localStorage & clean up any old notes
  useEffect(() => {
    try {
      const saved = localStorage.getItem('flashdrop_isolated_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach((k) => {
          if (Array.isArray(parsed[k])) {
            parsed[k] = parsed[k].map((m: ChatMessage) => {
              if (m.text) {
                m.text = m.text
                  .replace(/\n\n\*Note: Admin conversation history is completely isolated from all customer accounts\.\*/g, '')
                  .replace(/All queries and chat history are strictly isolated to your account \(user_id = \d+\)\.\s*/g, '');
              }
              return m;
            });
          }
        });
        setHistoryByAccount(parsed);
      }
    } catch {
      // Fallback if localStorage is unavailable
    }
  }, []);

  // 2. Persist historyByAccount whenever it updates
  useEffect(() => {
    try {
      if (Object.keys(historyByAccount).length > 0) {
        localStorage.setItem('flashdrop_isolated_chat_history', JSON.stringify(historyByAccount));
      }
    } catch {
      // Ignore storage errors
    }
  }, [historyByAccount]);

  // 3. Fetch session on mount, navigation, and auth events
  const fetchSession = () => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
        setLoadingUser(false);
      })
      .catch(() => setLoadingUser(false));
  };

  useEffect(() => {
    fetchSession();
    window.addEventListener('flashdrop_auth_change', fetchSession);
    return () => window.removeEventListener('flashdrop_auth_change', fetchSession);
  }, [pathname]);

  // 4. Compute active account key and its isolated message list
  const currentKey = getAccountKey(user);
  const currentMessages =
    historyByAccount[currentKey] && historyByAccount[currentKey].length > 0
      ? historyByAccount[currentKey]
      : [getDefaultWelcomeMessage(user)];

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages, isOpen, isMinimized]);

  // 5. Switch Account handler
  const handleSwitchAccount = async (email: string, password: string) => {
    setShowInChatSwitcher(false);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        window.dispatchEvent(new Event('flashdrop_auth_change'));
      }
    } catch (e) {
      console.error('In-chat switch failed', e);
    }
  };

  // 6. Clear current account's chat history
  const handleClearCurrentChat = () => {
    setHistoryByAccount((prev) => {
      const updated = { ...prev };
      delete updated[currentKey];
      return updated;
    });
  };

  // 7. Send message handler (isolated to targetKey)
  const handleSend = async (overridePrompt?: string) => {
    const query = (overridePrompt || inputPrompt).trim();
    if (!query || isSubmitting) return;

    const targetKey = currentKey;
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Append user message specifically to targetKey
    setHistoryByAccount((prev) => {
      const existing = prev[targetKey] && prev[targetKey].length > 0
        ? prev[targetKey]
        : [getDefaultWelcomeMessage(user)];
      return {
        ...prev,
        [targetKey]: [...existing, userMessage],
      };
    });

    setInputPrompt('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query }),
      });

      const data = await res.json();

      let assistantMsg: ChatMessage;
      if (data.success) {
        assistantMsg = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: data.message,
          sql: data.sql,
          explanation: data.explanation,
          rows: data.rows,
          columns: data.columns,
          durationMs: data.durationMs,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedQuestions: data.suggestedQuestions,
        };
      } else {
        assistantMsg = {
          id: `error-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ Error: ${data.error || 'Failed to process request.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }

      setHistoryByAccount((prev) => {
        const existing = prev[targetKey] || [getDefaultWelcomeMessage(user)];
        return {
          ...prev,
          [targetKey]: [...existing, assistantMsg],
        };
      });
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ Network Error: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setHistoryByAccount((prev) => {
        const existing = prev[targetKey] || [getDefaultWelcomeMessage(user)];
        return {
          ...prev,
          [targetKey]: [...existing, errorMsg],
        };
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <>
      {/* ----------------------------------------------------------------- */}
      {/* Floating Action Button (Always fixed at bottom-right)             */}
      {/* ----------------------------------------------------------------- */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className={`fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95 border backdrop-blur-md ${
            isAdmin
              ? 'bg-rose-950/90 hover:bg-rose-900 border-rose-500/50 text-white shadow-rose-950/50'
              : 'bg-zinc-900/90 hover:bg-zinc-800 border-rose-500/40 text-white shadow-black/80'
          }`}
        >
          <div className="relative">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                isAdmin ? 'bg-rose-600 text-white' : 'bg-gradient-to-tr from-rose-500 to-amber-500 text-white'
              }`}
            >
              {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isAdmin ? 'bg-rose-400' : 'bg-emerald-400'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isAdmin ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
              ></span>
            </span>
          </div>

          <div className="text-left font-sans">
            <div className="text-xs font-bold leading-tight flex items-center space-x-1">
              <span>{isAdmin ? 'FlashDrop Admin AI' : 'FlashDrop AI'}</span>
            </div>
            <div className="text-[10px] text-zinc-400 leading-tight">
              {isAdmin ? 'Executive SQL Intelligence' : `${user?.name ? user.name.split(' ')[0] : 'Shopper'} Concierge`}
            </div>
          </div>
        </button>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Floating Chat Modal / Drawer                                      */}
      {/* ----------------------------------------------------------------- */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-200 overflow-hidden ${
            isMinimized ? 'h-14' : 'h-[580px] max-h-[82vh]'
          } ${
            isAdmin
              ? 'bg-zinc-950/95 border-rose-600/40 shadow-rose-950/40'
              : 'bg-zinc-950/95 border-zinc-800 shadow-2xl'
          }`}
        >
          {/* Header */}
          <div
            className={`px-4 py-3 border-b flex items-center justify-between cursor-pointer select-none ${
              isAdmin
                ? 'bg-rose-950/40 border-rose-900/50'
                : 'bg-zinc-900/80 border-zinc-800'
            }`}
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                  isAdmin ? 'bg-rose-600 text-white' : 'bg-rose-500 text-white'
                }`}
              >
                {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <span>{isAdmin ? 'FlashDrop Executive AI' : 'FlashDrop Concierge'}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowInChatSwitcher(!showInChatSwitcher);
                    }}
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase flex items-center space-x-1 border transition hover:brightness-125 ${
                      isAdmin
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                    title="Click to Switch Customer Persona"
                  >
                    <span>{user ? user.name.split(' ')[0] : 'Guest'}</span>
                    <span className="text-[8px]">▼</span>
                  </button>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono flex items-center space-x-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Isolated Chat ({currentKey})</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleClearCurrentChat}
                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800/60 transition"
                title="Reset conversation for this account"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800/60 transition"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800/60 transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* In-Chat Account Switcher Menu */}
          {showInChatSwitcher && !isMinimized && (
            <div className="bg-zinc-900 border-b border-zinc-800 p-2 z-20 space-y-1 font-sans text-xs">
              <div className="text-[10px] font-mono text-zinc-400 uppercase font-semibold px-1">
                ⚡ Switch Persona (Instant Isolated Chat):
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleSwitchAccount('admin@flashdrop.com', 'admin123')}
                  className="p-1.5 rounded bg-zinc-950 border border-rose-500/30 text-left hover:bg-zinc-800 text-[11px] text-rose-300 font-mono"
                >
                  🛡️ Admin (DBA)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchAccount('user_2@flashdrop.com', 'customer123')}
                  className="p-1.5 rounded bg-zinc-950 border border-emerald-500/30 text-left hover:bg-zinc-800 text-[11px] text-emerald-300 font-mono"
                >
                  👤 Cust 1 ($376)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchAccount('user_3@flashdrop.com', 'customer123')}
                  className="p-1.5 rounded bg-zinc-950 border border-emerald-500/30 text-left hover:bg-zinc-800 text-[11px] text-emerald-300 font-mono"
                >
                  👤 Cust 2 ($820)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchAccount('user_4@flashdrop.com', 'customer123')}
                  className="p-1.5 rounded bg-zinc-950 border border-emerald-500/30 text-left hover:bg-zinc-800 text-[11px] text-emerald-300 font-mono"
                >
                  👤 Cust 3 ($145)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchAccount('user_5@flashdrop.com', 'customer123')}
                  className="p-1.5 rounded bg-zinc-950 border border-emerald-500/30 text-left hover:bg-zinc-800 text-[11px] text-emerald-300 font-mono"
                >
                  👤 Cust 4 ($1,250)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchAccount('user_6@flashdrop.com', 'customer123')}
                  className="p-1.5 rounded bg-zinc-950 border border-emerald-500/30 text-left hover:bg-zinc-800 text-[11px] text-emerald-300 font-mono"
                >
                  👤 Cust 5 ($55)
                </button>
              </div>
            </div>
          )}

          {/* Main Content Area (Hidden if Minimized) */}
          {!isMinimized && (
            <div className="flex-1 flex flex-col min-h-0 bg-zinc-950">
              {/* Message History (Strictly Isolated to currentKey) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs">
                {currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-rose-600 text-white font-medium rounded-br-sm'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-sm'
                      }`}
                    >
                      {/* Markdown-style formatting */}
                      <p className="whitespace-pre-wrap">{msg.text.replace(/\*\*(.*?)\*\*/g, '$1')}</p>

                      {/* Dynamic Miniature Data Table (if data rows exist) */}
                      {msg.rows && msg.rows.length > 0 && msg.columns && (
                        <div className="mt-2.5 pt-2 border-t border-zinc-800/80">
                          <div className="max-h-36 overflow-x-auto overflow-y-auto rounded border border-zinc-800 bg-zinc-950/80">
                            <table className="w-full text-[10px] font-mono text-left">
                              <thead className="bg-zinc-900 text-zinc-400 sticky top-0 border-b border-zinc-800">
                                <tr>
                                  {msg.columns.map((col) => (
                                    <th key={col} className="px-2 py-1 uppercase">{col}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-800/50">
                                {msg.rows.map((row, rIdx) => (
                                  <tr key={rIdx} className="hover:bg-zinc-900/50">
                                    {msg.columns!.map((col) => (
                                      <td key={col} className="px-2 py-1 text-zinc-300 whitespace-nowrap">
                                        {row[col] !== undefined && row[col] !== null ? String(row[col]) : '-'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Collapsible Underlying SQL Badge (Crucial for DBMS Viva Defense!) */}
                      {msg.sql && (
                        <div className="mt-2 pt-2 border-t border-zinc-800/80 font-mono">
                          <button
                            onClick={() =>
                              setExpandedSqlId(expandedSqlId === msg.id ? null : msg.id)
                            }
                            className="flex items-center space-x-1 text-[10px] text-zinc-400 hover:text-rose-400 transition"
                          >
                            <Database className="w-3 h-3 text-rose-500" />
                            <span>
                              {expandedSqlId === msg.id ? 'Hide MySQL Query' : 'View Generated MySQL 8 Query'}
                            </span>
                            {expandedSqlId === msg.id ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>

                          {expandedSqlId === msg.id && (
                            <div className="mt-1.5 p-2 rounded bg-black/80 border border-zinc-800 text-[10px] overflow-x-auto text-emerald-400">
                              <pre>{msg.sql}</pre>
                              {msg.durationMs !== undefined && (
                                <div className="mt-1 text-[9px] text-zinc-500 font-sans">
                                  ⚡ Execution Latency: {msg.durationMs} ms
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <span className="text-[9px] text-zinc-500 mt-1 px-1 font-mono">
                      {msg.timestamp}
                    </span>

                    {/* Quick Follow-up Question Chips */}
                    {msg.sender === 'assistant' && msg.suggestedQuestions && (
                      <div className="flex flex-wrap gap-1 mt-2 max-w-[95%]">
                        {msg.suggestedQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(q)}
                            className="text-[10px] px-2 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition text-left"
                          >
                            💬 {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isSubmitting && (
                  <div className="flex items-center space-x-2 text-zinc-400 text-xs py-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
                    <span>Querying database engine...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-zinc-800 bg-zinc-900/60">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="text"
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    placeholder={
                      isAdmin
                        ? 'Ask an admin question (e.g. top buyers, GMV)...'
                        : `Ask about ${user ? user.name.split(' ')[0] : 'your'} wallet or orders...`
                    }
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500/80 transition"
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    disabled={!inputPrompt.trim() || isSubmitting}
                    className="p-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white transition flex items-center justify-center"
                    title="Send"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                <div className="mt-2 text-[9px] text-zinc-500 font-mono text-center flex items-center justify-between px-1">
                  <span>🔒 Isolated History ({currentKey})</span>
                  <span>•</span>
                  <span>Role: {user ? user.role.toUpperCase() : 'GUEST'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
