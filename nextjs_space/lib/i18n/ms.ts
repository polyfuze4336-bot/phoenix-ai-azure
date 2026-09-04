import type { LocalizedContent } from './index';

export const ms: LocalizedContent = {
  community: {
    healthTips: [
      'Sejukkan kelecuran segera di bawah air mengalir selama 20 minit',
      'Jangan sapukan ubat gigi, mentega, atau ais pada kelecuran',
      'Pastikan luka bersih dan ditutup untuk mencegah jangkitan',
      'Dapatkan bantuan perubatan untuk kelecuran yang lebih besar daripada tapak tangan anda',
    ],
    chatQuickPrompts: [
      'Bagaimana merawat kelecuran ringan di rumah?',
      'Tanda-tanda luka dijangkiti',
      'Bilakah saya perlu pergi ke hospital untuk kelecuran?',
    ],
    articles: {
      filters: {
        all: 'Semua',
        prevention: 'Pencegahan',
        wound_care: 'Penjagaan Luka',
        nutrition: 'Pemakanan',
        infection: 'Jangkitan',
      },
      items: [
        {
          id: '1',
          category: 'prevention',
          title: 'Mencegah Kelecuran di Rumah',
          content: 'Kebanyakan kelecuran berlaku di rumah, terutamanya di dapur. Sentiasa awasi kanak-kanak di sekitar permukaan panas. Jauhkan minuman panas dari tepi meja. Pusingkan pemegang periuk ke dalam di atas dapur. Pasang pengesan asap dan simpan pemadam api yang mudah diakses. Jangan tinggalkan masakan tanpa pengawasan. Uji suhu air mandian sebelum memandikan kanak-kanak. Simpan pemetik api dan mancis di luar jangkauan kanak-kanak.',
        },
        {
          id: '2',
          category: 'wound_care',
          title: 'Penjagaan Luka yang Betul di Rumah',
          content: 'Penjagaan luka yang betul adalah penting untuk penyembuhan. Mulakan dengan membasuh tangan anda dengan teliti. Bersihkan luka dengan lembut menggunakan air bersih — elakkan alkohol atau hidrogen peroksida kerana bahan ini boleh merosakkan tisu. Sapukan lapisan nipis salap antiseptik. Tutup dengan pembalut steril dan tukar setiap hari. Pastikan luka lembap untuk penyembuhan yang lebih baik. Perhatikan tanda jangkitan seperti kemerahan yang meningkat, bengkak, panas, nanah, atau demam. Dapatkan rawatan perubatan jika luka dalam, pendarahan tidak berhenti, atau terdapat tanda jangkitan.',
        },
        {
          id: '3',
          category: 'nutrition',
          title: 'Pemakanan untuk Penyembuhan Luka',
          content: 'Pemakanan yang baik adalah penting untuk penyembuhan luka. Protein adalah penting — makan daging tanpa lemak, ikan, telur, tenusu, dan kekacang. Vitamin C membantu menghasilkan kolagen — makan buah sitrus, strawberi, lada benggala, dan brokoli. Zink menyokong fungsi imun dan terdapat dalam kacang, biji, bijirin penuh, dan kerang. Vitamin A menggalakkan pembaikan kulit dan terdapat dalam ubi keledek, lobak merah, bayam, dan hati. Kekal terhidrat dengan minum banyak air. Elakkan gula berlebihan dan makanan diproses yang boleh menjejaskan penyembuhan.',
        },
        {
          id: '4',
          category: 'infection',
          title: 'Mengenal Pasti Jangkitan Luka',
          content: 'Mengetahui tanda jangkitan luka dapat membantu anda mendapatkan rawatan perubatan tepat pada masanya. Perhatikan peningkatan kesakitan di sekitar luka, kemerahan yang merebak melangkaui tepi luka, bengkak dan kehangatan, nanah atau lelehan kuning atau hijau, bau busuk, garis merah dari luka, demam, atau menggigil. Jika anda melihat mana-mana tanda ini, dapatkan rawatan perubatan segera. Jangan cuba mengalirkan nanah sendiri. Pastikan luka bersih dan ditutup semasa menunggu bantuan perubatan.',
        },
        {
          id: '5',
          category: 'prevention',
          title: 'Keselamatan Kebakaran dan Kesiapsiagaan Kecemasan',
          content: 'Bersedia untuk kecemasan kebakaran dapat menyelamatkan nyawa. Pasang penggera asap di setiap tingkat rumah anda. Cipta dan amalkan pelan pelarian kebakaran bersama keluarga. Simpan pemadam api di dapur dan garaj. Ketahui teknik berhenti-jatuh-berguling jika pakaian terbakar. Sekiranya berlaku kebakaran, keluar dengan cepat, rendahkan badan untuk mengelakkan asap, dan hubungi 999. Jangan masuk semula ke dalam bangunan yang terbakar. Simpan nombor kecemasan di tempat yang mudah dilihat dan diakses.',
        },
      ],
    },
    assessment: {
      disclaimer: 'Ini ialah alat penilaian kendiri asas dan tidak menggantikan nasihat perubatan profesional. Jika ragu-ragu, dapatkan bantuan perubatan.',
      questionLabel: 'Soalan',
      nextStepLabel: 'Langkah Seterusnya yang Disyorkan',
      callEmergency: 'Hubungi 999 Sekarang',
      questions: [
        {
          id: 1,
          text: 'Apakah punca kelecuran?',
          options: [
            { label: 'Cecair panas (air, minyak)', score: 1 },
            { label: 'Api atau nyalaan', score: 2 },
            { label: 'Bahan kimia', score: 3 },
            { label: 'Elektrik', score: 4 },
            { label: 'Matahari atau radiasi', score: 1 },
          ],
        },
        {
          id: 2,
          text: 'Seberapa besar kawasan yang terbakar?',
          options: [
            { label: 'Lebih kecil daripada syiling', score: 0 },
            { label: 'Kira-kira sebesar tapak tangan anda', score: 1 },
            { label: 'Lebih besar daripada tapak tangan anda', score: 2 },
            { label: 'Meliputi kawasan badan yang besar (lengan, kaki, dada)', score: 4 },
          ],
        },
        {
          id: 3,
          text: 'Bagaimanakah rupa kelecuran?',
          options: [
            { label: 'Merah, seperti selaran matahari', score: 0 },
            { label: 'Merah dengan lepuh', score: 2 },
            { label: 'Putih, berlilin, atau hangus', score: 4 },
            { label: 'Tidak pasti', score: 2 },
          ],
        },
        {
          id: 4,
          text: 'Nilaikan tahap kesakitan (1-10)',
          options: [
            { label: 'Ringan (1-3)', score: 0 },
            { label: 'Sederhana (4-6)', score: 1 },
            { label: 'Teruk (7-9)', score: 2 },
            { label: 'Tiada sakit atau kebas (10)', score: 3 },
          ],
        },
      ],
      results: {
        minor: {
          title: 'Ringan — Penilaian Profesional Disyorkan',
          description: 'Ini kelihatan seperti kelecuran ringan. Berikan pertolongan cemas di rumah: sejukkan di bawah air mengalir selama 20 minit, sapukan aloe vera atau krim kelecuran, dan tutup dengan pembalut bersih. Pantau tanda jangkitan.',
          nextStep: 'Walaupun kecederaan melecur kelihatan ringan, pertimbangkan untuk mendapatkan penilaian daripada profesional penjagaan kesihatan di klinik atau perkhidmatan penjagaan kesihatan primer.',
        },
        moderate: {
          title: 'Sederhana — Dapatkan Penilaian Perubatan',
          description: 'Berikan pertolongan cemas dan aturkan penilaian perubatan.',
          nextStep: 'Sila dapatkan penilaian daripada profesional penjagaan kesihatan di hospital atau fasiliti perubatan yang sesuai.',
        },
        emergency: {
          title: 'Kecemasan — Pergi ke Hospital Segera',
          description: 'Ini kelihatan seperti kelecuran serius yang memerlukan perhatian perubatan kecemasan segera. Hubungi 999 atau pergi ke Jabatan Kecemasan terdekat dengan segera. Sementara menunggu, sejukkan kelecuran di bawah air mengalir.',
          nextStep: 'Sila dapatkan penilaian perubatan dengan segera di hospital. Hubungi 999 atau pergi ke Jabatan Kecemasan terdekat dengan segera.',
        },
      },
    },
    firstAidVideo: {
      title: 'Video Pertolongan Cemas',
      introduction: 'Tonton video pendidikan ringkas mengenai pertolongan cemas segera untuk kecederaan melecur.',
      iframeTitle: 'Video Pendidikan Pertolongan Cemas Melecur',
      unavailable: 'Video pertolongan cemas tidak tersedia buat sementara waktu. Sila cuba lagi kemudian.',
      featuredHeading: 'Video Pilihan',
      moreVideosHeading: 'Video Pertolongan Cemas Lain',
      watchVideo: 'Tonton Video',
      keyPointsHeading: 'Pertolongan Cemas Melecur',
      keyPoints: [
        {
          strong: 'Sejukkan kawasan melecur',
          text: ' dengan air paip yang mengalir selama ',
          secondaryStrong: '20–30 minit',
          suffix: '.',
        },
        {
          strong: 'Tutup kawasan melecur',
          text: ' secara perlahan dengan kain atau balutan yang bersih.',
        },
        {
          strong: 'Dapatkan rawatan perubatan',
          text: ' apabila sesuai.',
        },
        {
          strong: 'Jangan sapukan',
          text: ' ais, ubat gigi, minyak, mentega, krim, rawatan tradisional atau bahan-bahan lain pada kawasan melecur.',
        },
      ],
      misconceptions: 'Elakkan salah faham biasa atau rawatan di rumah yang boleh memburukkan kecederaan.',
      reminder: 'Ingat: Sejukkan → Tutup → Dapatkan Rawatan',
      disclaimer: 'Video ini adalah untuk tujuan pendidikan sahaja dan tidak menggantikan nasihat, diagnosis atau rawatan perubatan profesional. Dapatkan rawatan perubatan yang sesuai bagi kecederaan melecur yang serius atau membimbangkan.',
    },
    burnPrevention: {
      title: 'Pencegahan Kecederaan Melecur',
      introduction: 'Langkah praktikal untuk mengurangkan risiko kecederaan melecur di rumah, di sekitar kanak-kanak dan di tempat kerja.',
      categories: [
        {
          id: 'general-public',
          title: 'Orang Awam',
          points: [
            'Kenal pasti bahaya haba, api dan cecair panas yang biasa, serta kekalkan jarak selamat daripada permukaan panas dan nyalaan terbuka.',
            'Kendalikan cecair panas dengan berhati-hati dan gunakan perlindungan yang sesuai ketika mengendalikan objek panas.',
            'Periksa peralatan dan kabel elektrik untuk kerosakan yang jelas, serta ikut arahan peralatan dan keselamatan.',
            'Amalkan cara yang lebih selamat ketika mengendalikan bahan mudah terbakar.',
            'Ketahui lokasi pintu keluar kecemasan dan peralatan keselamatan asas jika berkenaan.',
          ],
        },
        {
          id: 'parents-caregivers',
          title: 'Ibu Bapa & Penjaga',
          points: [
            'Jauhkan minuman dan cecair panas daripada tepi meja serta jauhkan kanak-kanak dari kawasan memasak jika praktikal.',
            'Pusingkan pemegang periuk dan kuali jauh daripada tepi yang boleh dicapai.',
            'Awasi kanak-kanak di sekitar haba, nyalaan dan air panas.',
            'Simpan mancis dan pemetik api di luar jangkauan.',
            'Periksa suhu air mandi dan basuhan sebelum digunakan.',
            'Letakkan kabel peralatan supaya tidak mudah ditarik oleh kanak-kanak.',
            'Ajarkan keselamatan melecur dan kebakaran yang sesuai mengikut umur.',
          ],
        },
        {
          id: 'children',
          title: 'Kanak-kanak',
          points: [
            'Jangan sentuh permukaan panas dan jauhi api serta nyalaan.',
            'Minta bantuan orang dewasa sebelum mengendalikan makanan atau minuman panas.',
            'Jangan bermain dengan mancis atau pemetik api.',
            'Beritahu orang dewasa jika peralatan elektrik kelihatan rosak.',
            'Ikut arahan orang dewasa semasa kecemasan.',
          ],
        },
        {
          id: 'home-safety',
          title: 'Keselamatan Rumah / Domestik',
          sections: [
            {
              title: 'Dapur',
              points: [
                'Kendalikan cecair panas dengan berhati-hati dan letakkan permukaan memasak, periuk, kuali serta peralatan panas dengan selamat.',
              ],
            },
            {
              title: 'Bilik Mandi',
              points: [
                'Kurangkan pendedahan kepada air panas dan periksa suhu air sebelum mandi atau membasuh.',
              ],
            },
            {
              title: 'Elektrik',
              points: [
                'Jangan gunakan kabel atau palam yang rosak, elakkan susunan elektrik yang tidak selamat atau terlebih beban, dan gunakan peralatan mengikut arahan.',
              ],
            },
            {
              title: 'Keselamatan Kebakaran',
              points: [
                'Gunakan pengesan asap atau kebakaran jika sesuai, pastikan pintu keluar mudah diakses dan simpan sumber pencucuhan dengan selamat.',
              ],
            },
          ],
        },
        {
          id: 'workplace-safety',
          title: 'Keselamatan Tempat Kerja',
          points: [
            'Ikut prosedur dan keperluan keselamatan tempat kerja yang berkenaan.',
            'Gunakan peralatan perlindungan diri yang sesuai apabila diperlukan.',
            'Kenal pasti bahaya permukaan panas, wap, bahan kimia dan elektrik, serta ikut arahan peralatan.',
            'Kekalkan kawasan kerja yang selamat dan laporkan peralatan rosak atau keadaan tidak selamat.',
            'Pastikan akses dan peralatan kecemasan tidak terhalang, serta ikut prosedur kecemasan tempat kerja.',
            'Dapatkan latihan yang sesuai sebelum menjalankan tugas berbahaya.',
          ],
        },
      ],
      callout: {
        heading: 'Jika kecederaan melecur berlaku',
        text: 'Ketahui tindakan segera yang perlu dilakukan di bahagian Pertolongan Cemas.',
        button: 'Lihat Pertolongan Cemas',
      },
      disclaimer: 'Maklumat ini adalah untuk tujuan pendidikan umum. Ia tidak menjamin pencegahan dan tidak menggantikan keperluan keselamatan tempat kerja, kebakaran atau bangunan yang berkenaan.',
    },
    firstAid: {
      stepsLabel: 'Langkah',
      guides: [
        {
          id: 'burn',
          title: 'Pertolongan Cemas Kelecuran',
          dos: ['Sejukkan kelecuran di bawah air mengalir sejuk selama 20 minit', 'Tanggalkan barang kemas atau pakaian berhampiran kelecuran jika tidak melekat', 'Tutup dengan plastik pembalut atau pembalut bersih yang tidak berbulu', 'Ambil ubat tahan sakit seperti parasetamol', 'Dapatkan bantuan perubatan untuk kelecuran besar, dalam, atau pada muka'],
          donts: ['Jangan sapukan ais, mentega, ubat gigi, atau putih telur', 'Jangan pecahkan lepuh', 'Jangan tanggalkan pakaian yang melekat pada kelecuran', 'Jangan gunakan kapas berbulu atau pembalut pelekat terus pada kelecuran'],
          steps: ['1. Pastikan keselamatan — jauhkan daripada sumber haba', '2. Sejukkan di bawah air mengalir selama 20 minit', '3. Tanggalkan barang kemas dan pakaian longgar', '4. Tutup secara longgar dengan plastik pembalut', '5. Hubungi bantuan jika kelecuran teruk'],
        },
        {
          id: 'wound',
          title: 'Pertolongan Cemas Luka',
          dos: ['Bersihkan luka dengan lembut menggunakan air bersih', 'Tekan dengan kain bersih untuk menghentikan pendarahan', 'Sapukan antiseptik dan tutup dengan pembalut steril', 'Tukar pembalut setiap hari atau apabila kotor atau basah', 'Perhatikan tanda jangkitan seperti kemerahan, bengkak, atau nanah'],
          donts: ['Jangan sentuh luka dengan tangan kotor', 'Jangan gunakan alkohol atau hidrogen peroksida pada luka terbuka', 'Jangan cabut objek yang tertanam dalam luka dalam', 'Jangan korek kudis'],
          steps: ['1. Basuh tangan dengan teliti', '2. Tekan untuk menghentikan pendarahan', '3. Bersihkan luka di bawah air mengalir', '4. Sapukan krim antiseptik', '5. Tutup dengan pembalut steril'],
        },
        {
          id: 'chemical',
          title: 'Pertolongan Cemas Kelecuran Kimia',
          dos: ['Tanggalkan pakaian tercemar dengan segera', 'Bilas kawasan terjejas dengan air yang banyak selama sekurang-kurangnya 20 minit', 'Kenal pasti bahan kimia jika boleh', 'Dapatkan rawatan perubatan kecemasan dengan segera'],
          donts: ['Jangan cuba meneutralkan bahan kimia', 'Jangan sapukan krim atau salap', 'Jangan lambatkan pembilasan dengan air'],
          steps: ['1. Pastikan keselamatan anda dahulu', '2. Tanggalkan pakaian tercemar', '3. Bilas dengan air selama sekurang-kurangnya 20 minit', '4. Hubungi 999 dengan segera'],
        },
        {
          id: 'electrical',
          title: 'Pertolongan Cemas Kelecuran Elektrik',
          dos: ['Pastikan sumber kuasa dimatikan sebelum menghampiri', 'Hubungi 999 dengan segera', 'Periksa pernafasan dan nadi', 'Sejukkan kelecuran yang kelihatan dengan air', 'Rawat kejutan dengan membaringkan mangsa dan meninggikan kaki'],
          donts: ['Jangan sentuh mangsa jika masih bersentuhan dengan sumber elektrik', 'Jangan gerakkan mangsa kecuali jika terdapat bahaya segera', 'Jangan sapukan ais atau salap'],
          steps: ['1. Putuskan sumber kuasa', '2. Hubungi 999', '3. Periksa pernafasan', '4. Sejukkan kelecuran dengan air', '5. Pastikan mangsa hangat dan selesa'],
        },
        {
          id: 'sunburn',
          title: 'Pertolongan Cemas Selaran Matahari',
          dos: ['Beralih daripada cahaya matahari dengan segera', 'Sejukkan kulit dengan kain lembap atau mandian sejuk', 'Sapukan aloe vera atau pelembap selepas berjemur', 'Minum banyak air', 'Ambil ubat tahan sakit seperti ibuprofen jika perlu'],
          donts: ['Jangan sapukan ais terus pada selaran matahari', 'Jangan pecahkan lepuh selaran matahari', 'Jangan gunakan jeli petroleum pada selaran matahari'],
          steps: ['1. Beralih daripada cahaya matahari', '2. Sejukkan kulit dengan lembut', '3. Sapukan pelembap', '4. Kekal terhidrat', '5. Jumpa doktor jika terdapat lepuh atau demam'],
        },
      ],
    },
  },
  hcp: {
    chatQuickPrompts: ['Kira TBSA', 'Formula Parkland', 'Protokol Pengurusan Kelecuran', 'Penilaian Luka'],
    guidelines: {
      referencesLabel: 'Rujukan',
      filters: {
        all: 'Semua',
        burn_care: 'Penjagaan Kelecuran',
        wound_care: 'Penjagaan Luka',
        infection: 'Jangkitan',
        dressing: 'Pembalut',
        surgical: 'Pembedahan',
      },
      items: [
        {
          id: '1', category: 'burn_care', title: 'Penilaian Awal Kelecuran',
          summary: 'Pendekatan menyeluruh untuk penilaian awal kelecuran termasuk pengiraan TBSA dan penggredan keterukan.',
          steps: ['Pastikan keselamatan tempat kejadian dan jauhkan pesakit daripada sumber', 'Lakukan tinjauan utama menggunakan pendekatan ABCDE', 'Nilai kedalaman kelecuran dan kira TBSA menggunakan Peraturan Sembilan', 'Klasifikasikan keterukan kelecuran sebagai ringan, sederhana, atau besar', 'Mulakan resusitasi cecair bagi kelecuran melebihi 15% TBSA pada dewasa atau 10% pada kanak-kanak', 'Nilai kecederaan penyedutan', 'Dokumentasikan dan ambil gambar kecederaan'],
          references: ['Malaysian CPG on Management of Burns 2022', 'ISBI Practice Guidelines 2023'],
        },
        {
          id: '2', category: 'burn_care', title: 'Protokol Resusitasi Cecair',
          summary: 'Pengurusan cecair berasaskan formula Parkland untuk kelecuran sederhana hingga teruk.',
          steps: ['Kira jumlah cecair menggunakan Formula Parkland: 4 × berat (kg) × TBSA%', 'Berikan 50% daripada jumlah dalam 8 jam pertama dari masa kelecuran', 'Berikan baki 50% dalam 16 jam seterusnya', 'Gunakan Larutan Ringer Laktat', 'Pantau output urin: sasaran 0.5 mL/kg/jam bagi dewasa dan 1 mL/kg/jam bagi kanak-kanak', 'Laraskan kadar berdasarkan output urin', 'Pertimbangkan koloid selepas 24 jam'],
          references: ['ATLS 10th Edition', 'Malaysian CPG Burns Management'],
        },
        {
          id: '3', category: 'wound_care', title: 'Penyediaan Dasar Luka (Rangka Kerja TIME)',
          summary: 'Pendekatan sistematik untuk pengurusan luka menggunakan rangka kerja TIME.',
          steps: ['T - Tisu: Buang tisu yang tidak berdaya hidup', 'I - Jangkitan/Keradangan: Urus beban bio dan keradangan', 'M - Kelembapan: Kekalkan keseimbangan kelembapan optimum', 'E - Tepi: Nilai tepi luka yang tidak berkembang atau terhakis', 'Nilai semula luka pada setiap pertukaran pembalut', 'Dokumentasikan kemajuan luka menggunakan alat penilaian yang disahkan'],
          references: ['International Wound Journal 2023', 'Malaysian CPG Chronic Wound Management'],
        },
        {
          id: '4', category: 'infection', title: 'Pengurusan Jangkitan Luka Kelecuran',
          summary: 'Pengenalpastian, pencegahan, dan rawatan jangkitan luka kelecuran.',
          steps: ['Pantau peningkatan kesakitan, eritema, lelehan bernanah, dan demam', 'Dapatkan swab luka untuk kultur dan sensitiviti sebelum memulakan antibiotik', 'Sapukan antimikrob topikal seperti Silver Sulfadiazine atau Mafenide Acetate', 'Gunakan antibiotik sistemik untuk jangkitan invasif sahaja', 'Periksa dan dokumentasikan luka setiap hari', 'Pertimbangkan perlindungan antikulat jika antibiotik spektrum luas digunakan melebihi 7 hari'],
          references: ['ABA Practice Guidelines for Burn Care', 'Malaysian Antibiotic Guideline 2022'],
        },
        {
          id: '5', category: 'dressing', title: 'Panduan Pemilihan Pembalut',
          summary: 'Panduan berasaskan bukti untuk memilih pembalut yang sesuai berdasarkan ciri luka.',
          steps: ['Nilai dasar luka: bergranulasi, berselaput, nekrotik, atau berepitelium', 'Eksudat rendah: Pembalut hidrokoloid atau filem', 'Eksudat sederhana: Pembalut busa atau hidrofiber', 'Eksudat tinggi: Pembalut alginat atau penyerap super', 'Luka berjangkit: Pembalut mengandungi perak atau Cadexomer Iodine', 'Kelecuran: Pembalut berasaskan perak atau biosintetik', 'Tukar pembalut mengikut cadangan pengilang atau apabila tepu'],
          references: ['Wounds International Best Practice Statement', 'Malaysian MOH Formulary'],
        },
        {
          id: '6', category: 'surgical', title: 'Kriteria Rujukan Pembedahan',
          summary: 'Petunjuk untuk campur tangan pembedahan dalam pengurusan kelecuran dan luka.',
          steps: ['Kelecuran ketebalan penuh darjah ketiga atau keempat yang memerlukan eksisi dan cantuman', 'Kelecuran melebihi 20% TBSA pada dewasa atau 10% pada kanak-kanak atau warga emas', 'Kelecuran pada muka, tangan, kaki, perineum, atau sendi utama', 'Kelecuran sirkumferensial yang memerlukan eskarotomi', 'Kelecuran elektrik atau kimia dengan penglibatan tisu dalam', 'Luka yang tidak sembuh selepas 3 minggu penjagaan yang sesuai', 'Luka dengan tendon, tulang, atau sendi terdedah'],
          references: ['ISBI Guidelines 2023', 'Malaysian CPG Burns Referral Criteria'],
        },
      ],
    },
  },
};
