'use client';

import { useLanguage } from '@/components/language-provider';
import { Flame, Droplets, Zap, FlaskConical, Sun, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface Guide {
  id: string;
  icon: any;
  titleEn: string;
  titleBm: string;
  dosEn: string[];
  dosBm: string[];
  dontsEn: string[];
  dontsBm: string[];
  stepsEn: string[];
  stepsBm: string[];
}

const guides: Guide[] = [
  {
    id: 'burn', icon: Flame,
    titleEn: 'Burn First Aid', titleBm: 'Pertolongan Cemas Kelecuran',
    dosEn: ['Cool the burn under cool running water for 20 minutes', 'Remove jewellery/clothing near burn (if not stuck)', 'Cover with cling wrap or clean, non-fluffy dressing', 'Take pain relief (paracetamol)', 'Seek medical help for large, deep, or facial burns'],
    dosBm: ['Sejukkan kelecuran di bawah air mengalir sejuk selama 20 minit', 'Tanggalkan barang kemas/pakaian berhampiran kelecuran (jika tidak melekat)', 'Tutup dengan plastik pembalut atau pembalut bersih', 'Ambil ubat tahan sakit (parasetamol)', 'Dapatkan bantuan perubatan untuk kelecuran besar, dalam, atau di muka'],
    dontsEn: ['Do NOT apply ice, butter, toothpaste, or egg whites', 'Do NOT pop blisters', 'Do NOT remove clothing stuck to the burn', 'Do NOT use fluffy cotton or adhesive dressings directly on the burn'],
    dontsBm: ['JANGAN sapukan ais, mentega, ubat gigi, atau putih telur', 'JANGAN pecahkan lepuh', 'JANGAN tanggalkan pakaian yang melekat pada kelecuran', 'JANGAN gunakan kapas atau pembalut pelekat terus pada kelecuran'],
    stepsEn: ['1. Ensure safety — remove from heat source', '2. Cool under running water for 20 minutes', '3. Remove jewellery and loose clothing', '4. Cover with cling wrap loosely', '5. Call for help if burn is severe'],
    stepsBm: ['1. Pastikan keselamatan — jauhkan dari sumber haba', '2. Sejukkan di bawah air mengalir selama 20 minit', '3. Tanggalkan barang kemas dan pakaian longgar', '4. Tutup dengan plastik pembalut secara longgar', '5. Hubungi bantuan jika kelecuran teruk'],
  },
  {
    id: 'wound', icon: Droplets,
    titleEn: 'Wound First Aid', titleBm: 'Pertolongan Cemas Luka',
    dosEn: ['Clean the wound gently with clean water', 'Apply firm pressure with a clean cloth to stop bleeding', 'Apply antiseptic and cover with a sterile bandage', 'Change dressing daily or when dirty/wet', 'Watch for signs of infection (redness, swelling, pus)'],
    dosBm: ['Bersihkan luka dengan lembut menggunakan air bersih', 'Tekan dengan kain bersih untuk menghentikan pendarahan', 'Sapukan antiseptik dan tutup dengan pembalut steril', 'Tukar pembalut setiap hari atau apabila kotor/basah', 'Perhatikan tanda jangkitan (kemerahan, bengkak, nanah)'],
    dontsEn: ['Do NOT touch the wound with dirty hands', 'Do NOT use alcohol or hydrogen peroxide on open wounds', 'Do NOT remove embedded objects from deep wounds', 'Do NOT pick at scabs'],
    dontsBm: ['JANGAN sentuh luka dengan tangan kotor', 'JANGAN gunakan alkohol atau hidrogen peroksida pada luka terbuka', 'JANGAN cabut objek yang tertanam dalam luka dalam', 'JANGAN korek kudis'],
    stepsEn: ['1. Wash hands thoroughly', '2. Apply pressure to stop bleeding', '3. Clean wound under running water', '4. Apply antiseptic cream', '5. Cover with sterile bandage'],
    stepsBm: ['1. Basuh tangan dengan teliti', '2. Tekan untuk menghentikan pendarahan', '3. Bersihkan luka di bawah air mengalir', '4. Sapukan krim antiseptik', '5. Tutup dengan pembalut steril'],
  },
  {
    id: 'chemical', icon: FlaskConical,
    titleEn: 'Chemical Burn First Aid', titleBm: 'Pertolongan Cemas Kelecuran Kimia',
    dosEn: ['Remove contaminated clothing immediately', 'Flush affected area with large amounts of water for 20+ minutes', 'Identify the chemical if possible', 'Seek emergency medical attention immediately'],
    dosBm: ['Tanggalkan pakaian tercemar segera', 'Bilas kawasan yang terjejas dengan banyak air selama 20+ minit', 'Kenal pasti bahan kimia jika boleh', 'Dapatkan rawatan perubatan kecemasan segera'],
    dontsEn: ['Do NOT try to neutralize the chemical', 'Do NOT apply creams or ointments', 'Do NOT delay flushing with water'],
    dontsBm: ['JANGAN cuba meneutralkan bahan kimia', 'JANGAN sapukan krim atau salap', 'JANGAN lambatkan pembilasan dengan air'],
    stepsEn: ['1. Ensure your own safety first', '2. Remove contaminated clothing', '3. Flush with water for 20+ minutes', '4. Call 999 immediately'],
    stepsBm: ['1. Pastikan keselamatan anda dahulu', '2. Tanggalkan pakaian tercemar', '3. Bilas dengan air selama 20+ minit', '4. Hubungi 999 segera'],
  },
  {
    id: 'electrical', icon: Zap,
    titleEn: 'Electrical Burn First Aid', titleBm: 'Pertolongan Cemas Kelecuran Elektrik',
    dosEn: ['Ensure the power source is turned off before approaching', 'Call 999 immediately', 'Check for breathing and pulse', 'Cool visible burns with water', 'Treat for shock: lay person flat, elevate legs'],
    dosBm: ['Pastikan sumber kuasa dimatikan sebelum menghampiri', 'Hubungi 999 segera', 'Periksa pernafasan dan nadi', 'Sejukkan kelecuran yang kelihatan dengan air', 'Rawat untuk kejutan: baringkan orang, tinggikan kaki'],
    dontsEn: ['Do NOT touch person if still in contact with electrical source', 'Do NOT move the person unless in immediate danger', 'Do NOT apply ice or ointments'],
    dontsBm: ['JANGAN sentuh orang jika masih bersentuhan dengan sumber elektrik', 'JANGAN gerakkan orang kecuali dalam bahaya segera', 'JANGAN sapukan ais atau salap'],
    stepsEn: ['1. Disconnect power source', '2. Call 999', '3. Check breathing', '4. Cool burns with water', '5. Keep person warm and comfortable'],
    stepsBm: ['1. Putuskan sumber kuasa', '2. Hubungi 999', '3. Periksa pernafasan', '4. Sejukkan kelecuran dengan air', '5. Pastikan orang selesa dan hangat'],
  },
  {
    id: 'sunburn', icon: Sun,
    titleEn: 'Sunburn First Aid', titleBm: 'Pertolongan Cemas Selaran Matahari',
    dosEn: ['Move out of the sun immediately', 'Cool skin with damp cloths or cool bath', 'Apply aloe vera or after-sun moisturiser', 'Drink plenty of water', 'Take pain relief if needed (ibuprofen)'],
    dosBm: ['Keluar dari matahari segera', 'Sejukkan kulit dengan kain lembap atau mandian sejuk', 'Sapukan aloe vera atau pelembap selepas berjemur', 'Minum banyak air', 'Ambil ubat tahan sakit jika perlu (ibuprofen)'],
    dontsEn: ['Do NOT apply ice directly to sunburn', 'Do NOT pop blisters from sunburn', 'Do NOT use petroleum jelly on sunburn'],
    dontsBm: ['JANGAN sapukan ais terus pada selaran matahari', 'JANGAN pecahkan lepuh selaran matahari', 'JANGAN gunakan jeli petroleum pada selaran matahari'],
    stepsEn: ['1. Get out of the sun', '2. Cool the skin gently', '3. Apply moisturiser', '4. Stay hydrated', '5. See a doctor if blistering or fever occurs'],
    stepsBm: ['1. Keluar dari matahari', '2. Sejukkan kulit dengan lembut', '3. Sapukan pelembap', '4. Kekal terhidrat', '5. Jumpa doktor jika berlaku lepuh atau demam'],
  },
];

export function FirstAidClient() {
  const { t, lang } = useLanguage();
  const [expanded, setExpanded] = useState<string | null>('burn');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{t('community.firstaid_title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('community.firstaid_desc')}</p>
      </div>

      <div className="space-y-4">
        {guides?.map((guide: Guide) => {
          const isOpen = expanded === guide?.id;
          return (
            <motion.div key={guide?.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <button onClick={() => setExpanded(isOpen ? null : guide?.id)} className="w-full px-5 py-4 flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-lg bg-[#8B0000]/10 flex items-center justify-center shrink-0">
                  <guide.icon className="w-5 h-5 text-[#8B0000]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">{lang === 'en' ? guide?.titleEn : guide?.titleBm}</h3>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-5">
                      {/* Steps */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Steps</h4>
                        <div className="space-y-2">
                          {(lang === 'en' ? guide?.stepsEn : guide?.stepsBm)?.map((step: string, i: number) => (
                            <p key={i} className="text-sm text-gray-700 pl-1">{step}</p>
                          ))}
                        </div>
                      </div>

                      {/* Do / Don't */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="flex items-center gap-1.5 text-xs font-bold text-green-700 mb-3">
                            <CheckCircle2 className="w-4 h-4" /> {t('community.do')}
                          </h4>
                          <ul className="space-y-2">
                            {(lang === 'en' ? guide?.dosEn : guide?.dosBm)?.map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-green-800">
                                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4">
                          <h4 className="flex items-center gap-1.5 text-xs font-bold text-red-700 mb-3">
                            <XCircle className="w-4 h-4" /> {t('community.dont')}
                          </h4>
                          <ul className="space-y-2">
                            {(lang === 'en' ? guide?.dontsEn : guide?.dontsBm)?.map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-red-800">
                                <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
