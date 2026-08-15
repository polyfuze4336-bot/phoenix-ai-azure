'use client';

import { useLanguage } from '@/components/language-provider';
import { Send, ImagePlus, AlertTriangle, Calculator, Droplets, BookOpen, Stethoscope, Loader2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { localizedContent } from '@/lib/i18n/index';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

const quickPromptIcons = [Calculator, Droplets, BookOpen, Stethoscope];

export function HcpChatClient() {
  const { t, lang } = useLanguage();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [escalated, setEscalated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const quickPrompts = localizedContent(lang).hcp.chatQuickPrompts;

  const scrollToBottom = useCallback(() => {
    messagesEndRef?.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = text ?? input;
    if (!msg?.trim() && !imagePreview) return;
    const userMsg: ChatMsg = { role: 'user', content: msg?.trim() ?? '', image: imagePreview ?? undefined };
    setMessages(prev => [...(prev ?? []), userMsg]);
    setInput('');
    setImagePreview(null);
    setLoading(true);

    try {
      const response = await fetch('/api/hcp-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...(messages ?? []), userMsg]?.map((m: ChatMsg) => ({
            role: m?.role,
            content: m?.content,
            ...(m?.image ? { image: m.image } : {}),
          })),
          language: lang,
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
      setMessages(prev => [...(prev ?? []), { role: 'assistant', content: t('chat.error') }]);
    } finally {
      setLoading(false);
    }
  }, [input, imagePreview, lang, messages, t]);

  const handleImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev: any) => setImagePreview(ev?.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-xl font-bold text-gray-900">{t('chat.specialist_title')}</h1>
          <p className="text-xs text-gray-500">{t('chat.hcp_description')}</p>
        </div>
        <button
          onClick={() => setEscalated(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5" /> {t('chat.escalate')}
        </button>
      </div>

      {escalated && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <p className="text-xs text-red-600 font-medium">{t('chat.escalated')}</p>
        </div>
      )}

      {/* Quick Prompts */}
      {(messages?.length ?? 0) === 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2">{t('chat.quick_prompts')}</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, i) => {
              const Icon = quickPromptIcons[i] ?? Stethoscope;
              return (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-[#8B0000]/20 transition-all"
              >
                <Icon className="w-3.5 h-3.5 text-[#8B0000]" />
                {prompt}
              </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-none">
        {messages?.map((msg: ChatMsg, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg?.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              msg?.role === 'user'
                ? 'bg-[#8B0000] text-white rounded-br-md'
                : 'bg-white border border-gray-100 text-gray-700 rounded-bl-md shadow-sm'
            }`}>
              {msg?.image && (
                <div className="relative w-48 h-32 rounded-lg overflow-hidden mb-2">
                  <Image src={msg.image} alt="Attached" fill className="object-cover" />
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg?.content || (loading && i === (messages?.length ?? 0) - 1 ? '...' : '')}</p>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="relative inline-block mt-2">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
            <Image src={imagePreview} alt="Preview" fill className="object-cover" />
          </div>
          <button onClick={() => setImagePreview(null)} className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="mt-4 flex items-end gap-2">
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
        <button onClick={() => fileRef?.current?.click?.()} className="p-2.5 text-gray-400 hover:text-[#0F9B8E] transition-colors">
          <ImagePlus className="w-5 h-5" />
        </button>
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
            disabled={loading || (!input?.trim() && !imagePreview)}
            className="px-4 py-3 text-[#8B0000] hover:text-[#7a0000] disabled:text-gray-300 transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
