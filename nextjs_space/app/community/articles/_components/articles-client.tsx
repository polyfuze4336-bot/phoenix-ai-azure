'use client';

import { useLanguage } from '@/components/language-provider';
import { Flame, Shield, Apple, Bug, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';

interface Article {
  id: string;
  category: string;
  titleEn: string;
  titleBm: string;
  contentEn: string;
  contentBm: string;
  icon: any;
}

const articles: Article[] = [
  {
    id: '1', category: 'prevention', icon: Shield,
    titleEn: 'Preventing Burns at Home', titleBm: 'Mencegah Kelecuran di Rumah',
    contentEn: 'Most burns happen at home, especially in the kitchen. Always supervise children around hot surfaces. Keep hot drinks away from table edges. Turn pot handles inward on the stove. Install smoke detectors and keep a fire extinguisher accessible. Never leave cooking unattended. Test bath water temperature before bathing children. Keep lighters and matches out of reach of children.',
    contentBm: 'Kebanyakan kelecuran berlaku di rumah, terutamanya di dapur. Sentiasa awasi kanak-kanak di sekitar permukaan panas. Jauhkan minuman panas dari tepi meja. Pusingkan pemegang periuk ke dalam di atas dapur. Pasang pengesan asap dan simpan pemadam api yang mudah diakses. Jangan tinggalkan masakan tanpa pengawasan. Uji suhu air mandian sebelum memandikan kanak-kanak. Simpan pemetik api dan mancis di luar jangkauan kanak-kanak.',
  },
  {
    id: '2', category: 'wound_care', icon: Heart,
    titleEn: 'Proper Wound Care at Home', titleBm: 'Penjagaan Luka yang Betul di Rumah',
    contentEn: 'Proper wound care is essential for healing. Start by washing your hands thoroughly. Clean the wound gently with clean water — avoid using alcohol or hydrogen peroxide as they can damage tissue. Apply a thin layer of antiseptic ointment. Cover with a sterile bandage and change it daily. Keep the wound moist for better healing. Watch for signs of infection: increasing redness, swelling, warmth, pus, or fever. Seek medical attention if the wound is deep, won\'t stop bleeding, or shows signs of infection.',
    contentBm: 'Penjagaan luka yang betul adalah penting untuk penyembuhan. Mulakan dengan membasuh tangan anda dengan teliti. Bersihkan luka dengan lembut menggunakan air bersih — elakkan menggunakan alkohol atau hidrogen peroksida kerana ia boleh merosakkan tisu. Sapukan lapisan nipis salap antiseptik. Tutup dengan pembalut steril dan tukar setiap hari. Pastikan luka lembap untuk penyembuhan yang lebih baik. Perhatikan tanda-tanda jangkitan: kemerahan yang meningkat, bengkak, panas, nanah, atau demam. Dapatkan rawatan perubatan jika luka dalam, pendarahan tidak berhenti, atau menunjukkan tanda jangkitan.',
  },
  {
    id: '3', category: 'nutrition', icon: Apple,
    titleEn: 'Nutrition for Wound Healing', titleBm: 'Pemakanan untuk Penyembuhan Luka',
    contentEn: 'Good nutrition is crucial for wound healing. Protein is essential — eat lean meats, fish, eggs, dairy, and legumes. Vitamin C helps produce collagen — eat citrus fruits, strawberries, bell peppers, and broccoli. Zinc supports immune function — found in nuts, seeds, whole grains, and shellfish. Vitamin A promotes skin repair — found in sweet potatoes, carrots, spinach, and liver. Stay well-hydrated by drinking plenty of water. Avoid excessive sugar and processed foods that can impair healing.',
    contentBm: 'Pemakanan yang baik adalah penting untuk penyembuhan luka. Protein adalah penting — makan daging tanpa lemak, ikan, telur, tenusu, dan kekacang. Vitamin C membantu menghasilkan kolagen — makan buah sitrus, strawberi, lada benggala, dan brokoli. Zink menyokong fungsi imun — terdapat dalam kacang, biji, bijirin penuh, dan kerang. Vitamin A menggalakkan pembaikan kulit — terdapat dalam ubi keledek, lobak merah, bayam, dan hati. Kekal terhidrat dengan minum banyak air. Elakkan gula berlebihan dan makanan diproses yang boleh menjejaskan penyembuhan.',
  },
  {
    id: '4', category: 'infection', icon: Bug,
    titleEn: 'Recognizing Wound Infection', titleBm: 'Mengenal Pasti Jangkitan Luka',
    contentEn: 'Knowing the signs of wound infection can help you seek timely medical care. Watch for: increasing pain around the wound, spreading redness beyond the wound edges, swelling and warmth, yellow or green pus or discharge, foul smell from the wound, red streaks extending from the wound, fever or chills. If you notice any of these signs, seek medical attention promptly. Do not attempt to drain pus yourself. Keep the wound clean and covered while waiting for medical help.',
    contentBm: 'Mengetahui tanda-tanda jangkitan luka dapat membantu anda mendapatkan rawatan perubatan tepat pada masanya. Perhatikan: peningkatan kesakitan di sekitar luka, kemerahan yang merebak melangkaui tepi luka, bengkak dan kehangatan, nanah kuning atau hijau, bau busuk dari luka, garis merah memanjang dari luka, demam atau menggigil. Jika anda melihat mana-mana tanda ini, dapatkan rawatan perubatan segera. Jangan cuba mengalirkan nanah sendiri. Pastikan luka bersih dan ditutup semasa menunggu bantuan perubatan.',
  },
  {
    id: '5', category: 'prevention', icon: Flame,
    titleEn: 'Fire Safety and Emergency Preparedness', titleBm: 'Keselamatan Kebakaran dan Kesiapsiagaan Kecemasan',
    contentEn: 'Being prepared for fire emergencies can save lives. Install smoke alarms on every level of your home. Create and practice a fire escape plan with your family. Keep fire extinguishers in the kitchen and garage. Know the stop-drop-and-roll technique if clothing catches fire. In case of fire, get out quickly, stay low to avoid smoke, and call 999. Never go back inside a burning building. Keep emergency numbers visible and accessible.',
    contentBm: 'Bersedia untuk kecemasan kebakaran dapat menyelamatkan nyawa. Pasang penggera asap di setiap tingkat rumah anda. Cipta dan amalkan pelan pelarian kebakaran bersama keluarga. Simpan pemadam api di dapur dan garaj. Ketahui teknik berhenti-jatuh-berguling jika pakaian terbakar. Sekiranya berlaku kebakaran, keluar dengan cepat, rendahkan badan untuk mengelak asap, dan hubungi 999. Jangan masuk semula ke dalam bangunan yang terbakar. Simpan nombor kecemasan di tempat yang mudah dilihat dan diakses.',
  },
];

const categoryFilters = [
  { key: 'all', labelEn: 'All', labelBm: 'Semua' },
  { key: 'prevention', labelEn: 'Prevention', labelBm: 'Pencegahan' },
  { key: 'wound_care', labelEn: 'Wound Care', labelBm: 'Penjagaan Luka' },
  { key: 'nutrition', labelEn: 'Nutrition', labelBm: 'Pemakanan' },
  { key: 'infection', labelEn: 'Infection', labelBm: 'Jangkitan' },
];

export function ArticlesClient() {
  const { t, lang } = useLanguage();
  const [category, setCategory] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (category === 'all') return articles;
    return (articles ?? [])?.filter((a: Article) => a?.category === category);
  }, [category]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{t('community.articles_title')}</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {categoryFilters?.map((f: any) => (
          <button
            key={f?.key}
            onClick={() => setCategory(f?.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              category === f?.key ? 'bg-[#0F9B8E] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {lang === 'en' ? f?.labelEn : f?.labelBm}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered?.map((article: Article, i: number) => {
          const isOpen = expanded === article?.id;
          return (
            <motion.div key={article?.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : article?.id)} className="w-full px-5 py-4 flex items-center gap-4 text-left">
                  <div className="w-10 h-10 rounded-lg bg-[#0F9B8E]/10 flex items-center justify-center shrink-0">
                    <article.icon className="w-5 h-5 text-[#0F9B8E]" />
                  </div>
                  <h3 className="flex-1 text-sm font-semibold text-gray-900">{lang === 'en' ? article?.titleEn : article?.titleBm}</h3>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-700 leading-relaxed">{lang === 'en' ? article?.contentEn : article?.contentBm}</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
