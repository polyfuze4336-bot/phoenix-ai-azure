'use client';

import { useLanguage } from '@/components/language-provider';
import { Search, Flame, Droplets, Bug, Package, Scissors, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';

interface Guideline {
  id: string;
  category: string;
  titleEn: string;
  titleBm: string;
  summaryEn: string;
  summaryBm: string;
  stepsEn: string[];
  stepsBm: string[];
  references: string[];
}

const guidelines: Guideline[] = [
  {
    id: '1', category: 'burn_care',
    titleEn: 'Initial Assessment of Burns', titleBm: 'Penilaian Awal Kelecuran',
    summaryEn: 'Comprehensive approach to initial burn assessment including TBSA calculation and severity grading.',
    summaryBm: 'Pendekatan komprehensif untuk penilaian awal kelecuran termasuk pengiraan TBSA dan penggredan keterukan.',
    stepsEn: ['Ensure scene safety and remove patient from source', 'Primary survey (ABCDE approach)', 'Assess burn depth and calculate TBSA using Rule of Nines', 'Classify burn severity (minor, moderate, major)', 'Initiate fluid resuscitation for burns >15% TBSA (adult) or >10% TBSA (child)', 'Assess for inhalation injury', 'Document and photograph injuries'],
    stepsBm: ['Pastikan keselamatan tempat kejadian dan keluarkan pesakit dari sumber', 'Tinjauan utama (pendekatan ABCDE)', 'Nilai kedalaman kelecuran dan kira TBSA menggunakan Peraturan Sembilan', 'Klasifikasikan keterukan kelecuran (ringan, sederhana, besar)', 'Mulakan resusitasi cecair untuk kelecuran >15% TBSA (dewasa) atau >10% TBSA (kanak-kanak)', 'Nilai untuk kecederaan penyedutan', 'Dokumentasi dan ambil gambar kecederaan'],
    references: ['Malaysian CPG on Management of Burns 2022', 'ISBI Practice Guidelines 2023'],
  },
  {
    id: '2', category: 'burn_care',
    titleEn: 'Fluid Resuscitation Protocol', titleBm: 'Protokol Resusitasi Cecair',
    summaryEn: 'Parkland formula-based fluid management for moderate to severe burns.',
    summaryBm: 'Pengurusan cecair berasaskan formula Parkland untuk kelecuran sederhana hingga teruk.',
    stepsEn: ['Calculate total fluid using Parkland Formula: 4 × weight (kg) × TBSA%', 'Give 50% of total in first 8 hours from time of burn', 'Give remaining 50% over next 16 hours', 'Use Lactated Ringer\'s Solution', 'Monitor urine output: target 0.5 mL/kg/hr (adult), 1 mL/kg/hr (child)', 'Adjust rate based on urine output', 'Consider colloid after 24 hours'],
    stepsBm: ['Kira jumlah cecair menggunakan Formula Parkland: 4 × berat (kg) × TBSA%', 'Beri 50% jumlah dalam 8 jam pertama dari masa kelecuran', 'Beri baki 50% dalam 16 jam seterusnya', 'Gunakan Larutan Ringer Laktat', 'Pantau output urin: sasaran 0.5 mL/kg/jam (dewasa), 1 mL/kg/jam (kanak-kanak)', 'Laraskan kadar berdasarkan output urin', 'Pertimbangkan koloid selepas 24 jam'],
    references: ['ATLS 10th Edition', 'Malaysian CPG Burns Management'],
  },
  {
    id: '3', category: 'wound_care',
    titleEn: 'Wound Bed Preparation (TIME Framework)', titleBm: 'Penyediaan Dasar Luka (Rangka Kerja TIME)',
    summaryEn: 'Systematic approach to wound management using the TIME framework.',
    summaryBm: 'Pendekatan sistematik untuk pengurusan luka menggunakan rangka kerja TIME.',
    stepsEn: ['T - Tissue: Debride non-viable tissue', 'I - Infection/Inflammation: Manage bioburden and inflammation', 'M - Moisture: Maintain optimal moisture balance', 'E - Edge: Assess for non-advancing or undermined wound edges', 'Reassess wound at each dressing change', 'Document wound progress using validated assessment tools'],
    stepsBm: ['T - Tisu: Buang tisu yang tidak viable', 'I - Jangkitan/Keradangan: Urus beban bio dan keradangan', 'M - Kelembapan: Kekalkan keseimbangan kelembapan optimum', 'E - Tepi: Nilai tepi luka yang tidak maju atau terhakis', 'Nilai semula luka pada setiap pertukaran pembalut', 'Dokumentasikan kemajuan luka menggunakan alat penilaian yang disahkan'],
    references: ['International Wound Journal 2023', 'Malaysian CPG Chronic Wound Management'],
  },
  {
    id: '4', category: 'infection',
    titleEn: 'Burn Wound Infection Management', titleBm: 'Pengurusan Jangkitan Kelecuran',
    summaryEn: 'Recognition, prevention and treatment of burn wound infections.',
    summaryBm: 'Pengiktirafan, pencegahan dan rawatan jangkitan kelecuran.',
    stepsEn: ['Monitor for signs: increased pain, erythema, purulent discharge, fever', 'Obtain wound swab for culture and sensitivity before starting antibiotics', 'Apply topical antimicrobials: Silver Sulfadiazine or Mafenide Acetate', 'Systemic antibiotics for invasive infections only', 'Daily wound inspection and documentation', 'Consider antifungal coverage if broad-spectrum antibiotics used >7 days'],
    stepsBm: ['Pantau tanda-tanda: peningkatan kesakitan, eritema, lelehan purulen, demam', 'Dapatkan swab luka untuk kultur dan sensitiviti sebelum memulakan antibiotik', 'Sapukan antimikrob topikal: Silver Sulfadiazine atau Mafenide Acetate', 'Antibiotik sistemik untuk jangkitan invasif sahaja', 'Pemeriksaan dan dokumentasi luka harian', 'Pertimbangkan perlindungan antikulat jika antibiotik spektrum luas digunakan >7 hari'],
    references: ['ABA Practice Guidelines for Burn Care', 'Malaysian Antibiotic Guideline 2022'],
  },
  {
    id: '5', category: 'dressing',
    titleEn: 'Dressing Selection Guide', titleBm: 'Panduan Pemilihan Pembalut',
    summaryEn: 'Evidence-based guide for selecting appropriate wound dressings based on wound characteristics.',
    summaryBm: 'Panduan berasaskan bukti untuk memilih pembalut luka yang sesuai berdasarkan ciri-ciri luka.',
    stepsEn: ['Assess wound bed: granulating, sloughy, necrotic, epithelialising', 'Low exudate: Hydrocolloid or Film dressing', 'Moderate exudate: Foam or Hydrofiber dressing', 'High exudate: Alginate or Superabsorbent dressing', 'Infected wounds: Silver-containing dressings or Cadexomer Iodine', 'Burns: Silver-based dressings or Biosynthetic dressings', 'Change dressing per manufacturer recommendations or when saturated'],
    stepsBm: ['Nilai dasar luka: bergranulasi, berlendir, nekrotik, mengepitelium', 'Eksudat rendah: Pembalut Hydrokoloid atau Filem', 'Eksudat sederhana: Pembalut Busa atau Hydrofiber', 'Eksudat tinggi: Pembalut Alginat atau Superabsorben', 'Luka berjangkit: Pembalut mengandungi Perak atau Cadexomer Iodin', 'Kelecuran: Pembalut berasaskan Perak atau Biosintetik', 'Tukar pembalut mengikut cadangan pengilang atau apabila tepu'],
    references: ['Wounds International Best Practice Statement', 'Malaysian MOH Formulary'],
  },
  {
    id: '6', category: 'surgical',
    titleEn: 'Surgical Referral Criteria', titleBm: 'Kriteria Rujukan Pembedahan',
    summaryEn: 'Indications for surgical intervention in burn and wound management.',
    summaryBm: 'Petunjuk untuk campur tangan pembedahan dalam pengurusan kelecuran dan luka.',
    stepsEn: ['Full-thickness (3rd/4th degree) burns requiring excision and grafting', 'Burns >20% TBSA in adults, >10% in children or elderly', 'Burns to face, hands, feet, perineum, major joints', 'Circumferential burns requiring escharotomy', 'Electrical or chemical burns with deep tissue involvement', 'Non-healing wounds after 3 weeks of appropriate care', 'Wounds with exposed tendon, bone, or joint'],
    stepsBm: ['Kelecuran ketebalan penuh (darjah 3/4) memerlukan eksisi dan cantuman', 'Kelecuran >20% TBSA pada dewasa, >10% pada kanak-kanak atau warga emas', 'Kelecuran pada muka, tangan, kaki, perineum, sendi utama', 'Kelecuran sirkumferensial memerlukan escharotomi', 'Kelecuran elektrik atau kimia dengan penglibatan tisu dalam', 'Luka yang tidak sembuh selepas 3 minggu penjagaan yang sesuai', 'Luka dengan tendon, tulang, atau sendi yang terdedah'],
    references: ['ISBI Guidelines 2023', 'Malaysian CPG Burns Referral Criteria'],
  },
];

const categories = [
  { key: 'all', labelEn: 'All', labelBm: 'Semua', icon: null },
  { key: 'burn_care', labelEn: 'Burn Care', labelBm: 'Penjagaan Kelecuran', icon: Flame },
  { key: 'wound_care', labelEn: 'Wound Care', labelBm: 'Penjagaan Luka', icon: Droplets },
  { key: 'infection', labelEn: 'Infection', labelBm: 'Jangkitan', icon: Bug },
  { key: 'dressing', labelEn: 'Dressing', labelBm: 'Pembalut', icon: Package },
  { key: 'surgical', labelEn: 'Surgical', labelBm: 'Pembedahan', icon: Scissors },
];

export function GuidelinesClient() {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return (guidelines ?? [])?.filter((g: Guideline) => {
      const matchCat = category === 'all' || g?.category === category;
      const title = lang === 'en' ? g?.titleEn : g?.titleBm;
      const summary = lang === 'en' ? g?.summaryEn : g?.summaryBm;
      const matchSearch = !search || (title ?? '')?.toLowerCase()?.includes(search?.toLowerCase()) || (summary ?? '')?.toLowerCase()?.includes(search?.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, category, lang]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{t('guidelines.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('guidelines.subtitle')}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e: any) => setSearch(e?.target?.value ?? '')}
          placeholder={t('guidelines.search')}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {categories?.map((cat: any) => (
          <button
            key={cat?.key}
            onClick={() => setCategory(cat?.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              category === cat?.key ? 'bg-[#8B0000] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat?.icon && <cat.icon className="w-3.5 h-3.5" />}
            {lang === 'en' ? cat?.labelEn : cat?.labelBm}
          </button>
        ))}
      </div>

      {/* Guidelines List */}
      <div className="space-y-3">
        {filtered?.map((g: Guideline) => {
          const isOpen = expanded === g?.id;
          return (
            <motion.div
              key={g?.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : g?.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left"
              >
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{lang === 'en' ? g?.titleEn : g?.titleBm}</h3>
                  <p className="text-xs text-gray-500 mt-1">{lang === 'en' ? g?.summaryEn : g?.summaryBm}</p>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                      <ol className="space-y-2">
                        {(lang === 'en' ? g?.stepsEn : g?.stepsBm)?.map((step: string, i: number) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#8B0000]/10 text-[#8B0000] text-xs font-semibold shrink-0">{i + 1}</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                      {(g?.references?.length ?? 0) > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-50">
                          <p className="text-xs font-semibold text-gray-400 mb-1">References</p>
                          {g?.references?.map((ref: string, i: number) => (
                            <p key={i} className="text-xs text-gray-400">• {ref}</p>
                          ))}
                        </div>
                      )}
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
