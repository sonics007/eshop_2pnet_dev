'use client';

/**
 * CHAT MODULE - Admin Sessions Panel
 *
 * Zobrazenie chat relácií a možnosť odpovedať
 */

import { useState, useEffect, useCallback } from 'react';
import type { ChatSession, ChatMessage } from '@/lib/modules/chat';

interface ChatSessionsPanelProps {
  className?: string;
}

export function ChatSessionsPanel({ className = '' }: ChatSessionsPanelProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Načítaj relácie
  const loadSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/admin/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    // Auto-refresh každých 30 sekúnd
    const interval = setInterval(loadSessions, 30000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  // Načítaj správy pre vybranú reláciu
  const loadMessages = useCallback(async (sessionKey: string) => {
    try {
      const response = await fetch(`/api/chat/session/${sessionKey}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession);
      // Auto-refresh správ každých 5 sekúnd
      const interval = setInterval(() => loadMessages(selectedSession), 5000);
      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [selectedSession, loadMessages]);

  // Odoslanie odpovede
  const handleReply = async () => {
    if (!selectedSession || !replyText.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/chat/admin/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionKey: selectedSession,
          message: replyText.trim()
        })
      });

      if (response.ok) {
        setReplyText('');
        loadMessages(selectedSession);
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('sk-SK', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-card ${className}`}>
        <p className="text-sm text-slate-500">Načítavam chat relácie...</p>
      </div>
    );
  }

  return (
    <section className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-card ${className}`}>
      <h2 className="text-lg font-semibold text-slate-900">Chat relácie</h2>
      <p className="mt-1 text-sm text-slate-500">
        Správy od zákazníkov a možnosť odpovedať
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Zoznam relácií */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">Relácie ({sessions.length})</h3>
          <div className="max-h-96 space-y-2 overflow-y-auto rounded-2xl border border-slate-100 p-2">
            {sessions.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500">Žiadne chat relácie</p>
            ) : (
              sessions.map(session => (
                <button
                  key={session.sessionKey}
                  onClick={() => setSelectedSession(session.sessionKey)}
                  className={`w-full rounded-xl p-3 text-left transition ${
                    selectedSession === session.sessionKey
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-medium">
                    {session.visitorName || 'Anonymný návštevník'}
                  </p>
                  {session.visitorEmail && (
                    <p className={`text-xs ${selectedSession === session.sessionKey ? 'text-slate-300' : 'text-slate-500'}`}>
                      {session.visitorEmail}
                    </p>
                  )}
                  <p className={`mt-1 text-xs ${selectedSession === session.sessionKey ? 'text-slate-300' : 'text-slate-400'}`}>
                    {session.lastMessageAt ? formatDate(session.lastMessageAt) : 'Nové'}
                    {session.status === 'closed' && ' • Uzavreté'}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail relácie a správy */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">
            {selectedSession ? 'Správy' : 'Vyberte reláciu'}
          </h3>
          <div className="rounded-2xl border border-slate-100 p-3">
            {selectedSession ? (
              <>
                {/* Správy */}
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="p-4 text-center text-sm text-slate-500">Žiadne správy</p>
                  ) : (
                    messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`rounded-xl p-3 ${
                          msg.direction === 'agent'
                            ? 'ml-4 bg-emerald-50 text-emerald-800'
                            : 'mr-4 bg-slate-100 text-slate-700'
                        }`}
                      >
                        <p className="text-xs font-semibold">
                          {msg.direction === 'agent' ? 'Admin' : 'Návštevník'}
                        </p>
                        <p className="mt-1 text-sm">{msg.content}</p>
                        <p className="mt-1 text-xs opacity-60">
                          {formatDate(msg.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Formulár pre odpoveď */}
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                    placeholder="Napíšte odpoveď..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleReply}
                    disabled={sending || !replyText.trim()}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    {sending ? '...' : 'Odoslať'}
                  </button>
                </div>
              </>
            ) : (
              <p className="p-8 text-center text-sm text-slate-500">
                Vyberte reláciu zo zoznamu pre zobrazenie správ
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
