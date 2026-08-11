import { Flame, Droplets, Zap, FlaskConical, Sun, type LucideIcon } from 'lucide-react';

export interface FirstAidGuide {
  id: string;
  icon: LucideIcon;
  titleEn: string;
  titleBm: string;
  dosEn: string[];
  dosBm: string[];
  dontsEn: string[];
  dontsBm: string[];
  stepsEn: string[];
  stepsBm: string[];
}

// Mirrors the original community first-aid content (app/community/first-aid) so v2
// preserves identical guidance without modifying the original route.
export const FIRST_AID_GUIDES: FirstAidGuide[] = [
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
