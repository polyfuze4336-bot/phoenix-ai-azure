'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Sparkles, AlertTriangle, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'How do I estimate TBSA using the Rule of Nines?',
  'What are the referral criteria to a burns unit?',
  'Outline initial management for a superficial partial-thickness burn.',
  'What signs suggest a wound infection?',
];

export function ChatClient() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || loading) return;
      const userMsg: ChatMsg = { role: 'user', content: msg };
      const next = [...messages, userMsg];
      setMessages(next);
      setInput('');
      setLoading(true);
      try {
        const response = await fetch('/api/hcp-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }),
        });
        if (!response.ok) throw new Error('Chat failed');
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistant = '';
        let buffer = '';
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
        if (reader) {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                assistant += parsed?.choices?.[0]?.delta?.content ?? '';
                setMessages((prev) => {
                  const arr = [...prev];
                  if (arr.length) arr[arr.length - 1] = { role: 'assistant', content: assistant };
                  return arr;
                });
              } catch {
                /* skip */
              }
            }
          }
        }
      } catch {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, an error occurred. Please try again.' }]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages],
  );

  return (
    <div className="mx-auto flex h-[calc(100vh-13rem)] max-w-3xl flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border bg-card p-4 md:p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-display text-lg font-bold tracking-tight">Ask the clinical AI assistant</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">Evidence-informed guidance on burn &amp; wound assessment and care. Educational support only.</p>
            <div className="mt-6 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-lg border bg-background p-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={cn('flex gap-3', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              {m.role === 'assistant' ? (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </span>
              ) : null}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                )}
              >
                <p className="whitespace-pre-wrap">{m.content || (loading && i === messages.length - 1 ? '…' : '')}</p>
              </div>
              {m.role === 'user' ? (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <User className="h-4 w-4" />
                </span>
              ) : null}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask a clinical question…"
            rows={1}
            className="max-h-32 min-h-[44px] resize-none"
          />
          <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon" className="h-11 w-11 shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <AlertTriangle className="h-3 w-3" /> Educational decision-support only — not a substitute for clinical judgement.
        </p>
      </div>
    </div>
  );
}
