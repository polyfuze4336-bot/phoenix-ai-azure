'use client';

import { useLanguage } from '@/components/language-provider';
import { Send, Loader2, Heart, Flame, Shield, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useRef, useCallback, useEffect } from 'react';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

const quickPrompts = [
  { en: 'How to treat a minor burn at home?', bm: 'Bagaimana merawat kelecuran ringan di rumah?', icon: Flame },
  { en: 'Signs that a wound is infected', bm: 'Tanda-tanda luka dijangkiti', icon: Shield },
  { en: 'When should I go to the hospital for a burn?', bm: 'Bilakah saya perlu pergi ke hospital untuk kelecuran?', icon: Heart },
];

export function CommunityChatClient() {
  const { t, lang } = useLanguage();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef?.current?.scrollIntoView?.({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = text ?? input;
    if (!msg?.trim()) return;
    const userMsg: ChatMsg = { role: 'user', content: msg.trim() };
    setMessages(prev => [...(prev ?? []), userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/community-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...(messages ?? []), userMsg]?.map((m: ChatMsg) => ({ role: m?.role, content: m?.content })),
          lang,
        }),
      });

      if (!response?.ok) throw new Error('Chat failed');

      const reader = response?.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let partialRead = '';

      setMessages(prev => [...(prev ?? []), { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await (reader?.read() ?? { done: true, value: undefined });
        if (done) break;
        partialRead += decoder?.decode(value, { stream: true }) ?? '';
        const lines = partialRead?.split('\n') ?? [];
        partialRead = lines?.pop() ?? '';
        for (const line of (lines ?? [])) {
          if (line?.startsWith('data: ')) {
            const data = line?.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed?.choices?.[0]?.delta?.content ?? '';
              assistantContent += delta;
              setMessages(prev => {
                const arr = [...(prev ?? [])];
                if (arr?.length > 0) arr[arr.length - 1] = { role: 'assistant', content: assistantContent };
                return arr;
              });
            } catch (e: any) { /* skip */ }
          }
        }
      }
    } catch (err: any) {
      setMessages(prev => [...(prev ?? []), { role: 'assistant', content: 'Sorry, an error occurred. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, lang]);

  const hasEmergency = messages?.some((m: ChatMsg) => {
    const lower = m?.content?.toLowerCase?.() ?? '';
    return lower?.includes('emergency') || lower?.includes('999') || lower?.includes('kecemasan') || lower?.includes('segera ke hospital');
  });

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-xl font-bold text-gray-900">{t('chat.community_title')}</h1>
          <p className="text-xs text-gray-500">{lang === 'en' ? 'Friendly health guidance for burns and wounds' : 'Panduan kesihatan mesra untuk kelecuran dan luka'}</p>
        </div>
      </div>

      {hasEmergency && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center justify-between">
          <p className="text-xs text-red-600 font-medium">{lang === 'en' ? '⚠️ This sounds like an emergency!' : '⚠️ Ini kedengaran seperti kecemasan!'}</p>
          <a href="tel:999" className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold">
            <Phone className="w-3 h-3" /> 999
          </a>
        </div>
      )}

      {(messages?.length ?? 0) === 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2">{t('chat.quick_prompts')}</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts?.map((p: any, i: number) => (
              <button
                key={i}
                onClick={() => sendMessage(lang === 'en' ? p?.en : p?.bm)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-[#0F9B8E]/20 transition-all"
              >
                <p.icon className="w-3.5 h-3.5 text-[#0F9B8E]" />
                {lang === 'en' ? p?.en : p?.bm}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-none">
        {messages?.map((msg: ChatMsg, i: number) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg?.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              msg?.role === 'user' ? 'bg-[#0F9B8E] text-white rounded-br-md' : 'bg-white border border-gray-100 text-gray-700 rounded-bl-md shadow-sm'
            }`}>
              <p className="whitespace-pre-wrap">{msg?.content || (loading && i === (messages?.length ?? 0) - 1 ? '...' : '')}</p>
            </div>
          </motion.div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="mt-4 flex items-end gap-2">
        <div className="flex-1 flex items-end bg-white border border-gray-200 rounded-xl overflow-hidden">
          <input
            type="text"
            value={input}
            onChange={(e: any) => setInput(e?.target?.value ?? '')}
            onKeyDown={(e: any) => { if (e?.key === 'Enter' && !e?.shiftKey) { e?.preventDefault(); sendMessage(); } }}
            placeholder={t('chat.placeholder')}
            className="flex-1 px-4 py-3 text-sm focus:outline-none"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input?.trim()}
            className="px-4 py-3 text-[#0F9B8E] hover:text-[#0e8a7e] disabled:text-gray-300 transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
