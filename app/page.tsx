"use client";

import { useEffect, useMemo, useState } from "react";
import AuthGate from "./auth-gate";

type Kind = "kemenangan" | "syair" | "prediksi" | "jadwal" | "validasi";
type FormState = {
  brand: string; pasaran: string; tanggal: string; headline: string;
  nominal: string; angka: string; tema: string; warna: string;
  rasio: string; gaya: string; jadwalLama: string; jadwalBaru: string;
  catatan: string;
};

const kinds: { id: Kind; label: string; icon: string; hint: string }[] = [
  { id: "kemenangan", label: "Postingan Kemenangan", icon: "★", hint: "Bukti kemenangan yang meyakinkan" },
  { id: "syair", label: "Postingan Syair", icon: "✦", hint: "Syair premium penuh atmosfer" },
  { id: "prediksi", label: "Postingan Prediksi", icon: "◎", hint: "Angka prediksi yang mudah dibaca" },
  { id: "jadwal", label: "Perubahan Jadwal", icon: "◷", hint: "Pengumuman jadwal pasaran" },
  { id: "validasi", label: "Validasi Dana", icon: "✓", hint: "Cocokkan nama penerima dana" },
];

const initial: FormState = {
  brand: "TOGELUP", pasaran: "SINGAPORE TOTO", tanggal: "6 AGUSTUS 2026",
  headline: "SELAMAT KEPADA PEMENANG", nominal: "Rp 51.000.000", angka: "8 7 4 2",
  tema: "Phoenix royal bercahaya", warna: "Emerald green, aqua blue, cyan glow, gold accent",
  rasio: "4:5 — 1080 × 1350 px", gaya: "Premium, cinematic, HD, glossy 3D",
  jadwalLama: "23:30 WIB", jadwalBaru: "22:45 WIB", catatan: "Teks harus tajam, rapi, mudah dibaca, dan tidak terpotong.",
};

const themeBank = [
  "Phoenix royal bercahaya dengan sayap energi dan ornamen kerajaan",
  "Serigala bulan neon di hutan mistis dengan kabut sinematik",
  "Harimau emas penjaga gerbang emerald dengan aura berwibawa",
  "Topeng wayang luxury dengan ornamen Nusantara dan cahaya magis",
  "Kota futuristik cyber-luxury dengan hologram dan partikel cahaya",
  "Elang kristal di puncak pegunungan dengan langit dramatis",
  "Istana bawah laut turquoise dengan mutiara dan cahaya caustic",
  "Naga oriental emas di antara awan giok dan kilat halus",
  "Ksatria cosmic dengan armor perak dan portal galaksi",
  "Candi cahaya emerald dengan relief kuno dan atmosfer sakral",
];

const colorBank = [
  "Emerald green, aqua blue, cyan glow, gold accent",
  "Deep navy, electric blue, silver chrome, white glow",
  "Royal purple, magenta neon, black, champagne gold",
  "Forest green, turquoise, antique gold, warm amber",
  "Matte black, premium red, metallic gold, white highlight",
  "Midnight blue, violet, cyan plasma, silver accent",
  "Burgundy, rose gold, charcoal black, cream highlight",
  "Teal, jade green, platinum silver, electric aqua",
];

const styleBank = [
  "Premium cinematic advertising, glossy 3D, dramatic rim lighting",
  "Luxury editorial, clean hierarchy, realistic 4D depth, soft glow",
  "Epic fantasy cinematic, ultra-detailed, volumetric lighting",
  "Modern futuristic, glassmorphism panels, neon edge lighting",
  "Mythical creature art, symmetrical composition, royal atmosphere",
  "High-end sports advertising, dynamic perspective, energetic particles",
  "Elegant dark luxury, centered composition, metallic embossed details",
  "Anime cinematic premium, sharp character detail, dramatic environment",
];

const headlines: Record<Kind, string[]> = {
  kemenangan: ["SELAMAT KEPADA PEMENANG", "KEMENANGAN SPEKTAKULER", "JACKPOT BERHASIL DIRAIH", "BUKTI KEMENANGAN HARI INI", "CUAN BESAR SUDAH CAIR"],
  syair: ["SYAIR RAHASIA HARI INI", "BISIKAN ANGKA MALAM INI", "SYAIR PREMIUM PILIHAN", "PETUNJUK MISTERI HARI INI", "SYAIR EKSKLUSIF TERBARU"],
  prediksi: ["ANGKA PREDIKSI HARI INI", "PREDIKSI PILIHAN TERBAIK", "ANGKA JITU HARI INI", "PREDIKSI PREMIUM TERBARU", "FORMASI ANGKA PILIHAN"],
  jadwal: ["PERUBAHAN JADWAL PASARAN", "INFORMASI JADWAL TERBARU", "UPDATE JAM PENUTUPAN", "PENGUMUMAN PERUBAHAN WAKTU", "JADWAL PASARAN DIPERBARUI"],
  validasi: ["VALIDASI NAMA PENERIMA"],
};

const noteBank = [
  "Teks harus tajam, rapi, mudah dibaca, dan tidak terpotong. Gunakan ruang kosong yang seimbang.",
  "Prioritaskan hierarchy teks, detail karakter, dan keterbacaan pada layar ponsel. Hindari desain terlalu ramai.",
  "Buat fokus visual kuat di tengah, panel informasi bersih, dan semua tulisan terbaca jelas dalam ukuran kecil.",
  "Gunakan lighting sinematik, detail HD, efek premium secukupnya, tanpa watermark atau elemen brand lain.",
  "Komposisi harus eksklusif, profesional, simetris, dan siap digunakan sebagai iklan media sosial.",
];

function pickDifferent(list: string[], current: string) {
  const choices = list.filter((item) => item !== current);
  return choices[Math.floor(Math.random() * choices.length)] ?? list[0];
}

function Field({ label, value, onChange, placeholder, area = false }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; area?: boolean }) {
  const props = { value, placeholder, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value) };
  return <label className="field"><span>{label}</span>{area ? <textarea {...props} rows={3} /> : <input {...props} />}</label>;
}

export default function Home() {
  const [kind, setKind] = useState<Kind>("kemenangan");
  const [form, setForm] = useState<FormState>(initial);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [maskedName, setMaskedName] = useState("GARXX GARXXXX");
  const [originalName, setOriginalName] = useState("GARIN GARNIDA");
  const [validationReady, setValidationReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("prompt-history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const update = (key: keyof FormState) => (value: string) => setForm((old) => ({ ...old, [key]: value }));

  const validation = useMemo(() => {
    const mask = maskedName.toUpperCase().replace(/[^A-Z]/g, "");
    const original = originalName.toUpperCase().replace(/[^A-Z]/g, "");
    let matched = 0;
    const mismatchPositions: number[] = [];
    const comparisonTotal = Math.max(mask.length, original.length);
    for (let i = 0; i < comparisonTotal; i++) {
      const maskChar = mask[i];
      const originalChar = original[i];
      const isMatch = Boolean(maskChar && originalChar) && (maskChar === "X" || maskChar === originalChar);
      if (isMatch) matched++;
      else mismatchPositions.push(i + 1);
    }
    const sameLength = mask.length === original.length;
    const valid = comparisonTotal > 0 && sameLength && matched === comparisonTotal;
    const lengthDifference = Math.abs(mask.length - original.length);
    const shortageMessage = !sameLength
      ? mask.length > original.length
        ? `Nama Asli kurang ${lengthDifference} huruf.`
        : `Nama Tersamarkan kurang ${lengthDifference} huruf.`
      : "Jumlah huruf kedua nama sama.";
    return {
      mask,
      original,
      adjusted: originalName.trim().replace(/\s+/g, " ").toUpperCase(),
      matched,
      maskedTotal: mask.length,
      originalTotal: original.length,
      comparisonTotal,
      percentage: comparisonTotal ? Math.round((matched / comparisonTotal) * 100) : 0,
      valid,
      sameLength,
      shortageMessage,
      mismatchPositions,
    };
  }, [maskedName, originalName]);

  const prompt = useMemo(() => {
    const common = `Buat desain poster ${form.rasio} untuk brand ${form.brand}. Gaya visual ${form.gaya}. Gunakan palet warna ${form.warna}. Komposisi profesional, detail sangat tajam, pencahayaan sinematik, kontras kuat, kualitas iklan premium, siap posting di media sosial.`;
    const endings = `\n\nKetentuan: ${form.catatan} Logo ${form.brand} harus terlihat jelas dan eksklusif. Jangan menambah logo, watermark, atau nama brand lain.`;
    if (kind === "kemenangan") return `${common}\n\nGunakan tepat tiga gambar referensi yang saya unggah:\n1. GAMBAR 1 — FOTO WANITA: jadikan sebagai model utama di sisi kiri. Pertahankan kemiripan wajah, bentuk rambut, warna kulit, dan pakaian dari foto asli. Jangan mengganti identitas, jangan membuat wajah baru, dan jangan menambahkan orang lain. Tampilkan setengah badan atau tiga perempat badan dengan pose natural menghadap kamera.\n2. GAMBAR 2 — LOGO SITUS: gunakan logo asli tanpa mengganti tulisan, bentuk, proporsi, atau warna. Letakkan logo secara besar dan jelas di bagian atas poster dengan ruang aman di sekelilingnya. Jangan membuat ulang logo menggunakan teks AI.\n3. GAMBAR 3 — BUKTI TRANSFER: masukkan gambar bukti transfer asli ke dalam layar smartphone premium berukuran besar di sisi kanan. Pertahankan susunan, nominal, tanggal, jam, dan status transaksi dari gambar asli. Jangan mengarang data transaksi. Blur hanya nama bank, nomor rekening, nama pengirim, dan nama penerima untuk privasi; nominal dan status transaksi harus tetap terbaca.\n\nBuat poster bukti kemenangan sederhana tetapi mewah dengan tema visual ${form.tema}. Gunakan headline besar “${form.headline}” dan tampilkan nominal “${form.nominal}” sebagai fokus utama dalam tipografi 3D gold yang sangat menonjol. Cantumkan tanggal posting “${form.tanggal}”. Tambahkan koin emas beterbangan, berlian emerald, partikel cahaya, serta efek kemenangan premium yang menghubungkan model dan smartphone tanpa membuat desain terlalu ramai.\n\nSusunan wajib: logo di atas, model wanita di kiri, smartphone berisi bukti transfer di kanan, headline dan nominal besar di bagian tengah-bawah. Tambahkan empat panel keunggulan di bagian paling bawah: “AMAN TERPERCAYA”, “PROSES CEPAT”, “WIN RATE TINGGI”, dan “CUSTOMER SERVICE 24 JAM”. Jangan menampilkan nama pasaran, angka kemenangan, logo tambahan, watermark, atau orang lain.${endings}`;
    if (kind === "syair") return `${common}\n\nTema utama: ${form.tema}. Buat postingan syair misterius, elegan, dan berkelas untuk pasaran ${form.pasaran}, tanggal ${form.tanggal}. Gunakan headline “${form.headline}”. Sediakan panel syair utama dengan ruang teks yang lega, ornamen tematik, dan nuansa magis, tetapi teks tetap menjadi fokus.${endings}`;
    if (kind === "prediksi") return `${common}\n\nBuat poster dengan headline “${form.headline}” untuk pasaran ${form.pasaran}, tanggal ${form.tanggal}. Angka utama “${form.angka}” harus sangat besar, jelas, berjajar rapi, memiliki efek 3D glossy dan glow lembut. Gunakan tema ${form.tema}. Tambahkan panel informasi yang bersih dan hierarchy visual yang kuat.${endings}`;
    return `${common}\n\nBuat poster pengumuman dengan headline “${form.headline}” untuk ${form.pasaran}, tanggal ${form.tanggal}. Tampilkan jadwal lama “${form.jadwalLama}” dengan penanda lama, panah perubahan yang jelas, lalu jadwal baru “${form.jadwalBaru}” sebagai fokus terbesar. Suasana resmi, informatif, mendesak tetapi tetap elegan.${endings}`;
  }, [kind, form]);

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  };
  const savePrompt = () => {
    const next = [prompt, ...history.filter((x) => x !== prompt)].slice(0, 8);
    setHistory(next); localStorage.setItem("prompt-history", JSON.stringify(next));
  };

  const generatePrompt = () => {
    setForm((old) => ({
      ...old,
      tema: pickDifferent(themeBank, old.tema),
      warna: pickDifferent(colorBank, old.warna),
      gaya: pickDifferent(styleBank, old.gaya),
      headline: pickDifferent(headlines[kind], old.headline),
      catatan: pickDifferent(noteBank, old.catatan),
    }));
    setCopied(false);
  };

  return (
    <AuthGate><main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="brandLogo" src="/team-preman-karo.jpg" alt="Team Preman Karo" />
        </div>
        <p className="navLabel">JENIS POSTINGAN</p>
        <nav>{kinds.map((item) => <button key={item.id} className={kind === item.id ? "navItem active" : "navItem"} onClick={() => setKind(item.id)}><i>{item.icon}</i><span><b>{item.label}</b><small>{item.hint}</small></span></button>)}</nav>
        <div className="sideNote"><b>Tips hasil terbaik</b><p>Isi data selengkap mungkin. Gunakan angka, tanggal, warna, dan ukuran yang spesifik.</p></div>
      </aside>

      <section className="workspace">
        <header><div><p className="eyebrow">PROMPT STUDIO / {kinds.find((x) => x.id === kind)?.label.toUpperCase()}</p><p className="sub">Isi detail konten, lalu salin prompt siap pakai ke generator gambar pilihan Anda.</p></div><div className="status"><span /> Tersimpan lokal</div></header>

        <div className={kind === "validasi" ? "grid validationGrid" : "grid"}>
          {kind === "validasi" ? <section className="panel validationPanel">
            <div className="panelHead"><div><span>01</span><h2>Pengecekan Validasi Dana</h2></div><button className="ghost" onClick={() => { setMaskedName(""); setOriginalName(""); setValidationReady(false); }}>Reset</button></div>
            <div className="validationIntro"><b>COCOKKAN NAMA SECARA OTOMATIS</b><p>Huruf <strong>X</strong> dianggap sebagai huruf yang disembunyikan. Spasi dan tanda baca tidak dihitung.</p></div>
            <div className="validationInputs">
              <Field label="Tempel Nama Tersamarkan" value={maskedName} onChange={(value) => { setMaskedName(value); setValidationReady(false); }} placeholder="Contoh: GARXX GARXXXX" />
              <Field label="Tempel Nama Asli" value={originalName} onChange={(value) => { setOriginalName(value); setValidationReady(false); }} placeholder="Contoh: GARIN GARNIDA" />
            </div>
            <button className="validateButton" onClick={() => setValidationReady(true)}>✓ Hitung & Cocokkan Huruf</button>
            {validationReady && <div className={validation.valid ? "validationResult success" : "validationResult failed"}>
              <div className="resultStatus"><span>{validation.valid ? "✓" : "!"}</span><div><small>STATUS VALIDASI</small><b>{validation.valid ? "COCOK" : "TIDAK COCOK"}</b></div></div>
              <div className="adjustedName"><small>HASIL PENYESUAIAN</small><strong>{validation.adjusted || "—"}</strong></div>
              <div className="resultStats">
                <div><strong>{validation.maskedTotal}</strong><span>Nama tersamarkan</span></div>
                <div><strong>{validation.originalTotal}</strong><span>Nama asli</span></div>
                <div className={validation.valid ? "matchCard valid" : "matchCard invalid"}><strong>{validation.valid ? "COCOK" : "TIDAK COCOK"}</strong><span>Status</span></div>
              </div>
              <p className="resultSummary">{validation.shortageMessage}{validation.mismatchPositions.length > 0 ? ` Posisi tidak cocok atau kosong: ${validation.mismatchPositions.join(", ")}.` : ""}</p>
            </div>}
          </section> : <>
          <section className="panel formPanel">
            <div className="panelHead"><div><span>01</span><h2>Detail Konten</h2></div><button className="ghost" onClick={() => setForm(initial)}>Reset</button></div>
            {kind === "kemenangan" && <div className="referenceGuide"><b>3 GAMBAR REFERENSI UNTUK AI</b><span><i>1</i> Foto wanita</span><span><i>2</i> Logo situs</span><span><i>3</i> Bukti transfer</span><small>Unggah ketiganya bersama prompt hasil generator.</small></div>}
            <div className="formGrid">
              <Field label="Nama Brand" value={form.brand} onChange={update("brand")} />
              {kind !== "kemenangan" && <Field label="Nama Pasaran" value={form.pasaran} onChange={update("pasaran")} />}
              <Field label="Tanggal Posting" value={form.tanggal} onChange={update("tanggal")} />
              {kind === "kemenangan" && <><Field label="Headline" value={form.headline} onChange={update("headline")} /><Field label="Nominal Kemenangan" value={form.nominal} onChange={update("nominal")} /></>}
              {kind === "prediksi" && <Field label="Angka Prediksi" value={form.angka} onChange={update("angka")} />}
              {kind === "jadwal" && <><Field label="Jadwal Lama" value={form.jadwalLama} onChange={update("jadwalLama")} /><Field label="Jadwal Baru" value={form.jadwalBaru} onChange={update("jadwalBaru")} /></>}
              {(kind === "kemenangan" || kind === "syair" || kind === "prediksi") && <Field label="Tema / Karakter Visual" value={form.tema} onChange={update("tema")} />}
              <Field label="Palet Warna" value={form.warna} onChange={update("warna")} />
              <Field label="Ukuran / Rasio" value={form.rasio} onChange={update("rasio")} />
              <Field label="Gaya Desain" value={form.gaya} onChange={update("gaya")} />
              <div className="wide"><Field label="Catatan Tambahan" value={form.catatan} onChange={update("catatan")} area /></div>
            </div>
          </section>

          <section className="panel outputPanel">
            <div className="panelHead"><div><span>02</span><h2>Prompt Siap Pakai</h2></div><span className="live">● LIVE</span></div>
            <div className="promptBox"><div className="promptTop"><span>GENERATED PROMPT</span><span>{prompt.length} karakter</span></div><p>{prompt}</p></div>
            <div className="actions triple"><button className="generate" onClick={generatePrompt}>✦ Generate Prompt</button><button className="primary" onClick={copyPrompt}>{copied ? "✓ Tersalin" : "Salin Prompt"}</button><button className="secondary" onClick={savePrompt}>Simpan</button></div>
            <div className="quality"><span>✓</span><div><b>Prompt sudah dioptimalkan</b><small>Struktur, visual, teks, dan batasan sudah lengkap.</small></div></div>
          </section>
          </>}
        </div>

        {kind !== "validasi" && history.length > 0 && <section className="history"><div className="historyTitle"><h2>Riwayat Prompt</h2><button onClick={() => { setHistory([]); localStorage.removeItem("prompt-history"); }}>Hapus semua</button></div><div className="historyGrid">{history.map((item, i) => <button key={i} onClick={() => navigator.clipboard.writeText(item)}><span>#{String(i + 1).padStart(2, "0")}</span><p>{item}</p><b>Salin</b></button>)}</div></section>}
      </section>
    </main></AuthGate>
  );
}
