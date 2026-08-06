'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from './language-provider';
import { Download, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const { lang } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed
    const dismissed = sessionStorage.getItem('pwa-dismissed');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (dismissed || isStandalone) return;

    // Check iOS
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIos(isiOS);

    if (isiOS) {
      // Show iOS install guide after 3 seconds
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Desktop
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIosGuide(false);
    sessionStorage.setItem('pwa-dismissed', 'true');
  };

  const texts = {
    en: {
      title: 'Install Phoenix AI',
      desc: 'Add to your home screen for the best experience',
      install: 'Install App',
      iosTitle: 'Install on iPhone/iPad',
      iosStep1: '1. Tap the Share button',
      iosStep2: '2. Scroll down and tap "Add to Home Screen"',
      iosStep3: '3. Tap "Add" to install',
      gotIt: 'Got it!',
    },
    bm: {
      title: 'Pasang Phoenix AI',
      desc: 'Tambah ke skrin utama untuk pengalaman terbaik',
      install: 'Pasang Aplikasi',
      iosTitle: 'Pasang di iPhone/iPad',
      iosStep1: '1. Ketik butang Kongsi',
      iosStep2: '2. Tatal ke bawah dan ketik "Tambah ke Skrin Utama"',
      iosStep3: '3. Ketik "Tambah" untuk memasang',
      gotIt: 'Faham!',
    },
  };
  const txt = texts[lang] || texts.en;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-[60] md:left-auto md:right-6 md:max-w-sm"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {showIosGuide ? (
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-gray-900">{txt.iosTitle}</h3>
                  <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>{txt.iosStep1} <span className="inline-block">⎋</span></p>
                  <p>{txt.iosStep2}</p>
                  <p>{txt.iosStep3}</p>
                </div>
                <button
                  onClick={handleDismiss}
                  className="mt-4 w-full py-2.5 rounded-xl bg-[#8B0000] text-white font-semibold text-sm"
                >
                  {txt.gotIt}
                </button>
              </div>
            ) : (
              <div className="p-4 flex items-center gap-4">
                <div className="relative w-12 h-12 shrink-0">
                  <Image src="/logo.png" alt="Phoenix AI" fill className="object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-gray-900 text-sm">{txt.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{txt.desc}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDismiss}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleInstall}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B0000] text-white text-xs font-semibold hover:bg-[#6B0000] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {txt.install}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
