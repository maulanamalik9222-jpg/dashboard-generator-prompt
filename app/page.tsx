"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AuthGate from "./auth-gate";

type Kind =
  | "kemenangan"
  | "syair"
  | "prediksi"
  | "jadwal"
  | "validasi"
  | "usdt"
  | "result"
  | "bola"
  | "monitor"
  | "handover"
  | "resultTracker"
  | "resultArchive";
type HandoverShift = "pagi" | "malam";
type HandoverEntry = { id: string; content: string };
type ResultMarket = {
  id: string;
  name: string;
  shift: "pagi" | "malam";
  closeTime: string;
  resultTime: string;
  officialUrl: string;
  active: boolean;
};
type ResultRecord = {
  id: string;
  marketId: string;
  marketName: string;
  shift: "pagi" | "malam";
  resultDate: string;
  closeTime: string;
  resultTime: string;
  prize1: string;
  prize2: string;
  prize3: string;
  officialLink: string;
  adminResult: string;
  updatedAt: number;
  updatedByName?: string;
};
type ShioSetting = { name: string; numbers: string };
const DEFAULT_RESULT_SHIO: ShioSetting[] = [
  {name:"KUDA",numbers:"01, 13, 25, 37, 49, 61, 73, 85, 97"},
  {name:"ULAR",numbers:"02, 14, 26, 38, 50, 62, 74, 86, 98"},
  {name:"NAGA",numbers:"03, 15, 27, 39, 51, 63, 75, 87, 99"},
  {name:"KELINCI",numbers:"04, 16, 28, 40, 52, 64, 76, 88, 00"},
  {name:"HARIMAU",numbers:"05, 17, 29, 41, 53, 65, 77, 89"},
  {name:"KERBAU",numbers:"06, 18, 30, 42, 54, 66, 78, 90"},
  {name:"TIKUS",numbers:"07, 19, 31, 43, 55, 67, 79, 91"},
  {name:"BABI",numbers:"08, 20, 32, 44, 56, 68, 80, 92"},
  {name:"ANJING",numbers:"09, 21, 33, 45, 57, 69, 81, 93"},
  {name:"AYAM",numbers:"10, 22, 34, 46, 58, 70, 82, 94"},
  {name:"MONYET",numbers:"11, 23, 35, 47, 59, 71, 83, 95"},
  {name:"KAMBING",numbers:"12, 24, 36, 48, 60, 72, 84, 96"},
];
type FootballMatch = {
  time: string;
  date: string;
  home: string;
  away: string;
  score: string;
};
type FootballLeague = { name: string; matches: FootballMatch[] };
type FootballData = {
  title: string;
  sourceUrl: string;
  leagues: FootballLeague[];
  matchCount: number;
  leagueCount: number;
  fetchedAt: string;
  wpScript: string;
};
type LinkCheckResult = {
  id?: string;
  hasImage?: boolean;
  categoryId?: string;
  url: string;
  hostname: string;
  status: "safe" | "problem";
  httpStatus: number | null;
  latency: number;
  finalUrl: string;
  checkedAt: string;
  message: string;
  nawala: "safe" | "blocked" | "unknown";
};
type MonitorCategory = {
  id: string;
  name: string;
  url: string;
  login: boolean;
  active: boolean;
};
type FormState = {
  brand: string;
  pasaran: string;
  tanggal: string;
  headline: string;
  nominal: string;
  angka: string;
  tema: string;
  warna: string;
  rasio: string;
  gaya: string;
  jadwalLama: string;
  jadwalBaru: string;
  catatan: string;
  judulSyair: string;
  bb2d: string;
  arahUtara: string;
  arahTimur: string;
  arahSelatan: string;
  arahBarat: string;
  bbfs: string;
  shio: string;
  colokBebas: string;
  top4d: string;
  isiSyair: string;
  predBbfs: string;
  predAngkaMain: string;
  pred4d: string;
  pred3d: string;
  pred2d: string;
  predColok2d: string;
  predColokBebas: string;
  predShio: string;
};

const kinds: { id: Kind; label: string; icon: string; hint: string }[] = [
  {
    id: "kemenangan",
    label: "Postingan Kemenangan",
    icon: "★",
    hint: "Bukti kemenangan yang meyakinkan",
  },
  {
    id: "syair",
    label: "Postingan Syair",
    icon: "✦",
    hint: "Syair premium penuh atmosfer",
  },
  {
    id: "prediksi",
    label: "Postingan Prediksi",
    icon: "◎",
    hint: "Angka prediksi yang mudah dibaca",
  },
  {
    id: "jadwal",
    label: "Perubahan Jadwal",
    icon: "◷",
    hint: "Pengumuman jadwal pasaran",
  },
  {
    id: "validasi",
    label: "Validasi Dana",
    icon: "✓",
    hint: "Cocokkan nama penerima dana",
  },
  {
    id: "usdt",
    label: "Update USDT",
    icon: "₮",
    hint: "Buat informasi rate terbaru",
  },
  {
    id: "result",
    label: "Keterlambatan Result",
    icon: "!",
    hint: "Informasi status result pasaran",
  },
  {
    id: "bola",
    label: "Prediksi Bola",
    icon: "⚽",
    hint: "Jadwal dan prediksi skor harian",
  },
  {
    id: "monitor",
    label: "Cek Link Situs Otomatis",
    icon: "▣",
    hint: "Pengecekan kategori dua shift",
  },
  {
    id: "handover",
    label: "Data Serah Terima",
    icon: "⇄",
    hint: "Catatan serah terima dua shift",
  },
  {
    id: "resultTracker",
    label: "Result Pasaran",
    icon: "◉",
    hint: "Jadwal dan input result harian",
  },
  {
    id: "resultArchive",
    label: "Arsip Hasil Result",
    icon: "⌕",
    hint: "Cari hasil berdasarkan tanggal",
  },
];

function getAutomaticDate() {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(new Date())
    .toUpperCase();
}

function getAutomaticDateTime() {
  const parts = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("day")} ${value("month").toUpperCase()} ${value("year")} (${value("hour")}:${value("minute")}:${value("second")} WIB)`;
}

function getWibIsoDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getWibClockParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value || 0);
  return { hour: value("hour"), minute: value("minute"), second: value("second") };
}

function minutesFromClock(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : 0;
}

const initial: FormState = {
  brand: "TOGELUP",
  pasaran: "SINGAPORE TOTO",
  tanggal: getAutomaticDate(),
  headline: "SELAMAT KEPADA PEMENANG",
  nominal: "Rp 51.000.000",
  angka: "8 7 4 2",
  tema: "Phoenix royal bercahaya",
  warna: "Emerald green, aqua blue, cyan glow, gold accent",
  rasio: "4:5 — 1080 × 1350 px",
  gaya: "Premium, cinematic, HD, glossy 3D",
  jadwalLama: "23:30 WIB",
  jadwalBaru: "22:45 WIB",
  catatan: "Teks harus tajam, rapi, mudah dibaca, dan tidak terpotong.",
  judulSyair: "SYAIR PEDOMAN",
  bb2d: "39, 26, 74, 57",
  arahUtara: "5",
  arahTimur: "8",
  arahSelatan: "7",
  arahBarat: "3",
  bbfs: "0, 2",
  shio: "KELINCI",
  colokBebas: "4, 1",
  top4d: "1507, 1861, 3016",
  isiSyair:
    "Kelinci putih melompat tenang\nMeniti taman diterpa terang\nTelinga tajam menangkap petunjuk\nJejak keberuntungan mulai terbentuk",
  predBbfs: "718537",
  predAngkaMain: "28585",
  pred4d: "9600, 6003, 6587, 6531",
  pred3d: "553, 261, 460",
  pred2d: "10, 82",
  predColok2d: "28, 42, 90",
  predColokBebas: "2, 1",
  predShio: "ULAR",
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
  kemenangan: [
    "SELAMAT KEPADA PEMENANG",
    "KEMENANGAN SPEKTAKULER",
    "JACKPOT BERHASIL DIRAIH",
    "BUKTI KEMENANGAN HARI INI",
    "CUAN BESAR SUDAH CAIR",
  ],
  syair: [
    "SYAIR RAHASIA HARI INI",
    "BISIKAN ANGKA MALAM INI",
    "SYAIR PREMIUM PILIHAN",
    "PETUNJUK MISTERI HARI INI",
    "SYAIR EKSKLUSIF TERBARU",
  ],
  prediksi: [
    "ANGKA PREDIKSI HARI INI",
    "PREDIKSI PILIHAN TERBAIK",
    "ANGKA JITU HARI INI",
    "PREDIKSI PREMIUM TERBARU",
    "FORMASI ANGKA PILIHAN",
  ],
  jadwal: [
    "PERUBAHAN JADWAL PASARAN",
    "INFORMASI JADWAL TERBARU",
    "UPDATE JAM PENUTUPAN",
    "PENGUMUMAN PERUBAHAN WAKTU",
    "JADWAL PASARAN DIPERBARUI",
  ],
  validasi: ["VALIDASI NAMA PENERIMA"],
  usdt: ["UPDATE RATE USDT"],
  result: ["INFORMASI RESULT PASARAN"],
  bola: ["PREDIKSI BOLA HARI INI"],
  monitor: ["CEK LINK SITUS OTOMATIS"],
};

const noteBank = [
  "Teks harus tajam, rapi, mudah dibaca, dan tidak terpotong. Gunakan ruang kosong yang seimbang.",
  "Prioritaskan hierarchy teks, detail karakter, dan keterbacaan pada layar ponsel. Hindari desain terlalu ramai.",
  "Buat fokus visual kuat di tengah, panel informasi bersih, dan semua tulisan terbaca jelas dalam ukuran kecil.",
  "Gunakan lighting sinematik, detail HD, efek premium secukupnya, tanpa watermark atau elemen brand lain.",
  "Komposisi harus eksklusif, profesional, simetris, dan siap digunakan sebagai iklan media sosial.",
];

const shioBank = [
  "KUDA",
  "ULAR",
  "NAGA",
  "KELINCI",
  "HARIMAU",
  "KERBAU",
  "TIKUS",
  "BABI",
  "ANJING",
  "AYAM",
  "MONYET",
  "KAMBING",
];

const syairByShio: Record<string, string[]> = {
  KUDA: [
    "Kuda perkasa berlari kencang\nMenerjang kabut menuju terang\nDerap langkah membawa petunjuk\nJalur keberuntungan mulai terbentuk",
    "Kuda hitam melintas malam\nTapak berkilau di tanah kelam\nAngin berbisik membuka jalan\nTanda keberuntungan datang perlahan",
  ],
  ULAR: [
    "Ular zamrud melingkar sunyi\nSisik bercahaya menyimpan arti\nGeraknya tenang membaca arah\nPetunjuk rahasia mulai merekah",
    "Ular emas turun perlahan\nMenyusuri batu penuh ramalan\nDesis halus membawa pesan\nAngka pilihan hadir berurutan",
  ],
  NAGA: [
    "Naga langit terbang berputar\nMembelah awan memancarkan sinar\nRaung agung membuka petunjuk\nTakdir keberuntungan mulai terbentuk",
    "Naga emas menjaga gerbang\nApi biru menyala terang\nSisik berkilau memberi tanda\nPetunjuk pilihan hadir di mata",
  ],
  KELINCI: [
    "Kelinci putih melompat tenang\nMeniti taman diterpa terang\nTelinga tajam menangkap petunjuk\nJejak keberuntungan mulai terbentuk",
    "Kelinci bulan duduk berseri\nMenjaga rahasia di malam sunyi\nLangkah kecil meninggalkan tanda\nPetunjuk pilihan hadir di mata",
  ],
  HARIMAU: [
    "Harimau loreng turun ke lembah\nTatapan tajam membaca arah\nAuman malam membuka petunjuk\nJejak keberuntungan mulai terbentuk",
    "Harimau emas menjaga hutan\nMelangkah gagah penuh keyakinan\nCakar bercahaya memberi tanda\nPetunjuk pilihan hadir di mata",
  ],
  KERBAU: [
    "Kerbau perkasa membelah ladang\nLangkahnya teguh menuju terang\nTanduk mengarah membawa petunjuk\nJalur keberuntungan mulai terbentuk",
    "Kerbau hitam berjalan pelan\nMenembus kabut di perbukitan\nJejak kuat meninggalkan tanda\nPetunjuk pilihan hadir di mata",
  ],
  TIKUS: [
    "Tikus lincah keluar malam\nMencari jalan di lorong kelam\nMata kecil menangkap petunjuk\nJejak keberuntungan mulai terbentuk",
    "Tikus putih menjaga peti\nMenyimpan rahasia penuh arti\nGerak cepat meninggalkan tanda\nPetunjuk pilihan hadir di mata",
  ],
  BABI: [
    "Babi hutan melintas pelan\nMembuka jalan di balik semak malam\nLangkah tenang membawa petunjuk\nJalur keberuntungan mulai terbentuk",
    "Babi emas berdiri teguh\nMenjaga taman berembun penuh\nTanah bergetar memberi tanda\nPetunjuk pilihan hadir di mata",
  ],
  ANJING: [
    "Anjing penjaga menatap malam\nMendengar bisikan dari kejauhan\nKesetiaannya membaca petunjuk\nJalur keberuntungan mulai terbentuk",
    "Anjing putih berdiri siaga\nMenjaga gerbang penuh cahaya\nJejak langkah memberi tanda\nPetunjuk pilihan hadir di mata",
  ],
  AYAM: [
    "Ayam jantan berseru pagi\nMembangunkan alam penuh energi\nKepak sayap membawa petunjuk\nJalur keberuntungan mulai terbentuk",
    "Ayam emas berdiri tinggi\nMenyambut fajar yang berseri\nKokok nyaring memberi tanda\nPetunjuk pilihan hadir di mata",
  ],
  MONYET: [
    "Monyet lincah melompat tinggi\nMembaca ranting penuh misteri\nGerak cerdik membawa petunjuk\nJalur keberuntungan mulai terbentuk",
    "Monyet emas duduk di dahan\nMenatap bintang penuh ramalan\nTangan lincah memberi tanda\nPetunjuk pilihan hadir di mata",
  ],
  KAMBING: [
    "Kambing gunung mendaki tinggi\nMenembus awan di pagi hari\nTanduk kokoh membawa petunjuk\nJalur keberuntungan mulai terbentuk",
    "Kambing putih di puncak bukit\nMenatap lembah saat fajar terbit\nLangkah pasti memberi tanda\nPetunjuk pilihan hadir di mata",
  ],
};

function pickDifferent(list: string[], current: string) {
  const choices = list.filter((item) => item !== current);
  return choices[Math.floor(Math.random() * choices.length)] ?? list[0];
}

function randomUniqueNumbers(count: number, maximum: number, digits: number) {
  const values = new Set<number>();
  while (values.size < count) values.add(Math.floor(Math.random() * maximum));
  return Array.from(values).map((value) => String(value).padStart(digits, "0"));
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  area = false,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  area?: boolean;
  readOnly?: boolean;
}) {
  const props = {
    value,
    placeholder,
    readOnly,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
  };
  return (
    <label className="field">
      <span>{label}</span>
      {area ? <textarea {...props} rows={3} /> : <input {...props} />}
    </label>
  );
}

export default function Home() {
  const [kind, setKind] = useState<Kind>("kemenangan");
  const [kindLoaded, setKindLoaded] = useState(false);
  const [isMaster, setIsMaster] = useState(false);
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [allowedMenus, setAllowedMenus] = useState<Kind[]>(kinds.map(item=>item.id));
  const [form, setForm] = useState<FormState>(initial);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [maskedName, setMaskedName] = useState("GARXX GARXXXX");
  const [originalName, setOriginalName] = useState("GARIN GARNIDA");
  const [validationReady, setValidationReady] = useState(false);
  const [usdtRaw, setUsdtRaw] = useState(
    "Usdt Ratio Deposit : 17,755\nUsdt Ratio Withdraw : 17,933",
  );
  const [usdtDeposit, setUsdtDeposit] = useState("17,755");
  const [usdtWithdraw, setUsdtWithdraw] = useState("17,933");
  const [usdtLinkOne, setUsdtLinkOne] = useState("");
  const [usdtLinkTwo, setUsdtLinkTwo] = useState("");
  const [usdtDateTime, setUsdtDateTime] = useState(getAutomaticDateTime());
  const [usdtCopied, setUsdtCopied] = useState(false);
  const [resultMarket, setResultMarket] = useState("KENTUCKYEVE");
  const [resultCopied, setResultCopied] = useState<"delay" | "done" | null>(
    null,
  );
  const [rgbOpen, setRgbOpen] = useState(false);
  const [rgbOne, setRgbOne] = useState("#00d9ff");
  const [rgbTwo, setRgbTwo] = useState("#ffe600");
  const [rgbThree, setRgbThree] = useState("#00ffa8");
  const [rgbSpeed, setRgbSpeed] = useState(12);
  const [rgbLoaded, setRgbLoaded] = useState(false);
  const [displayMode, setDisplayMode] = useState<"dark" | "light">("dark");
  const [footballData, setFootballData] = useState<FootballData | null>(null);
  const [footballLoading, setFootballLoading] = useState(false);
  const [footballError, setFootballError] = useState("");
  const [footballTheme, setFootballTheme] = useState<"blue" | "black">("blue");
  const [footballCopied, setFootballCopied] = useState(false);
  const [monitorRaw, setMonitorRaw] = useState("");
  const [monitorInterval, setMonitorInterval] = useState(30);
  const [monitorAuto, setMonitorAuto] = useState(false);
  const [monitorIntervalUnit, setMonitorIntervalUnit] = useState<"minute" | "hour">("minute");
  const [monitorNextRunAt, setMonitorNextRunAt] = useState("");
  const [monitorScheduleSaved, setMonitorScheduleSaved] = useState(false);
  const [monitorResults, setMonitorResults] = useState<LinkCheckResult[]>([]);
  const [monitorChecking, setMonitorChecking] = useState(false);
  const [monitorError, setMonitorError] = useState("");
  const [monitorLastChecked, setMonitorLastChecked] = useState("");
  const [monitorShift, setMonitorShift] = useState<"pagi" | "malam">("pagi");
  const [monitorCategories, setMonitorCategories] = useState<MonitorCategory[]>(
    [],
  );
  const [monitorCategoryName, setMonitorCategoryName] = useState("");
  const [monitorCategoryUrl, setMonitorCategoryUrl] = useState("");
  const [monitorSettingsOpen, setMonitorSettingsOpen] = useState(false);
  const [monitorLoginOpen, setMonitorLoginOpen] = useState(false);
  const [monitorUsername, setMonitorUsername] = useState("");
  const [monitorPassword, setMonitorPassword] = useState("");
  const [monitorLoginReady, setMonitorLoginReady] = useState(false);
  const [monitorSearch, setMonitorSearch] = useState("");
  const [monitorLoaded, setMonitorLoaded] = useState(false);
  const [monitorServerReady, setMonitorServerReady] = useState(false);
  const [monitorExtensionReady, setMonitorExtensionReady] = useState(false);
  const [monitorExtensionWarning, setMonitorExtensionWarning] = useState(false);
  const [monitorExtensionProgress, setMonitorExtensionProgress] = useState("");
  const [handoverShift, setHandoverShift] = useState<HandoverShift>("pagi");
  const [handoverDraft, setHandoverDraft] = useState("");
  const [handoverData, setHandoverData] = useState<
    Record<HandoverShift, HandoverEntry[]>
  >({ pagi: [], malam: [] });
  const [handoverLoaded, setHandoverLoaded] = useState(false);
  const [handoverCopied, setHandoverCopied] = useState(false);
  const [resultMarkets, setResultMarkets] = useState<ResultMarket[]>([]);
  const [todayResultRecords, setTodayResultRecords] = useState<ResultRecord[]>([]);
  const [resultArchive, setResultArchive] = useState<ResultRecord[]>([]);
  const [resultClock, setResultClock] = useState(new Date());
  const [resultActiveDate, setResultActiveDate] = useState(getWibIsoDate());
  const [resultLoading, setResultLoading] = useState(false);
  const [resultError, setResultError] = useState("");
  const [resultManageOpen, setResultManageOpen] = useState(false);
  const [resultEditMarket, setResultEditMarket] = useState<ResultMarket | null>(null);
  const [resultMarketDraft, setResultMarketDraft] = useState({
    name: "",
    shift: "pagi" as "pagi" | "malam",
    closeTime: "09:25",
    resultTime: "09:30",
    officialUrl: "",
    active: true,
  });
  const [resultEditor, setResultEditor] = useState<ResultMarket | null>(null);
  const [resultInput, setResultInput] = useState({
    prize1: "",
    prize2: "",
    prize3: "",
    officialLink: "",
    adminResult: "",
  });
  const [resultFilterMode, setResultFilterMode] = useState<"day" | "month">("day");
  const [resultFilterDate, setResultFilterDate] = useState(getWibIsoDate());
  const [resultFilterMonth, setResultFilterMonth] = useState(new Date().getMonth() + 1);
  const [resultFilterYear, setResultFilterYear] = useState(new Date().getFullYear());
  const [resultShioYear,setResultShioYear]=useState(new Date().getFullYear());
  const [resultShioSettings,setResultShioSettings]=useState<ShioSetting[]>(DEFAULT_RESULT_SHIO);
  const [resultCopyId,setResultCopyId]=useState("");
  const monitorCaptureResolvers = useRef(
    new Map<
      string,
      {
        resolve: (value: any) => void;
        reject: (reason: Error) => void;
        timer: number;
      }
    >(),
  );
  const monitorRunLock = useRef(false);
  const [monitorPreview, setMonitorPreview] = useState<{
    id: string;
    name: string;
    checkedAt: string;
  } | null>(null);

  useEffect(() => {
    const savedKind = localStorage.getItem("premankaro-active-menu");
    if (savedKind && kinds.some((item) => item.id === savedKind))
      setKind(savedKind as Kind);
    const saved = localStorage.getItem("prompt-history");
    if (saved) setHistory(JSON.parse(saved));
    const savedThemeVersion = localStorage.getItem("premankaro-theme-version");
    const savedRgb =
      savedThemeVersion === "up-cyan-v1"
        ? localStorage.getItem("premankaro-rgb")
        : null;
    const savedMode = localStorage.getItem("premankaro-display-mode");
    const savedMonitor = localStorage.getItem("premankaro-link-monitor");
    const savedHandover = localStorage.getItem("premankaro-handover-data");
    if (savedMode === "light" || savedMode === "dark")
      setDisplayMode(savedMode);
    if (savedRgb) {
      try {
        const rgb = JSON.parse(savedRgb);
        if (rgb.one) setRgbOne(rgb.one);
        if (rgb.two) setRgbTwo(rgb.two);
        if (rgb.three) setRgbThree(rgb.three);
        if (rgb.speed) setRgbSpeed(Number(rgb.speed));
      } catch {}
    } else {
      localStorage.setItem(
        "premankaro-rgb",
        JSON.stringify({
          one: "#00d9ff",
          two: "#ffe600",
          three: "#00ffa8",
          speed: 12,
        }),
      );
    }
    localStorage.setItem("premankaro-theme-version", "up-cyan-v1");
    if (savedMonitor) {
      try {
        const monitor = JSON.parse(savedMonitor);
        if (typeof monitor.raw === "string") setMonitorRaw(monitor.raw);
        if (Number(monitor.interval) >= 1)
          setMonitorInterval(Number(monitor.interval));
        if (monitor.intervalUnit === "hour") setMonitorIntervalUnit("hour");
        setMonitorAuto(Boolean(monitor.auto));
        if (typeof monitor.nextRunAt === "string")
          setMonitorNextRunAt(monitor.nextRunAt);
        if (Array.isArray(monitor.categories))
          setMonitorCategories(monitor.categories);
        if (
          monitor.day === getAutomaticDate() &&
          Array.isArray(monitor.results)
        ) {
          setMonitorResults(monitor.results);
          setMonitorLastChecked(String(monitor.lastChecked || ""));
        }
      } catch {}
    }
    if (savedHandover) {
      try {
        const parsed = JSON.parse(savedHandover);
        setHandoverData({
          pagi: Array.isArray(parsed?.pagi) ? parsed.pagi : [],
          malam: Array.isArray(parsed?.malam) ? parsed.malam : [],
        });
      } catch {}
    }
    setHandoverLoaded(true);
    setRgbLoaded(true);
    setMonitorLoaded(true);
    setKindLoaded(true);
  }, []);

  useEffect(() => {
    fetch("/api/auth", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {const master=data?.user?.role==="admin";const assistant=data?.user?.staffRole==="assistant";setIsMaster(master||assistant);setCanManageUsers(master||assistant);const access=Array.isArray(data?.user?.access)?data.user.access.filter((id:string)=>kinds.some(item=>item.id===id)):kinds.map(item=>item.id);setAllowedMenus(master||assistant?kinds.map(item=>item.id):access)})
      .catch(() => {setIsMaster(false);setCanManageUsers(false);setAllowedMenus([])});
  }, []);

  useEffect(()=>{if(isMaster||allowedMenus.includes(kind))return;const firstAllowed=kinds.find(item=>allowedMenus.includes(item.id));if(firstAllowed)setKind(firstAllowed.id)},[allowedMenus,isMaster,kind]);

  const loadMonitor = async (shift = monitorShift) => {
    try {
      const response = await fetch(`/api/site-monitor?shift=${shift}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Data monitor gagal dimuat.");
      if (Array.isArray(data.categories) && data.categories.length) {
        setMonitorCategories(
          data.categories.map((item: any) => ({
            id: String(item.id),
            name: String(item.name),
            url: String(item.url),
            login: Boolean(item.login),
            active: Boolean(item.active),
          })),
        );
      }
      setMonitorResults(
        (data.results || []).map((item: any) => ({
          id: String(item.id),
          hasImage: Boolean(item.hasImage),
          categoryId: String(item.categoryId),
          url: "",
          hostname: "",
          status: item.status === "safe" ? "safe" : "problem",
          httpStatus: item.httpStatus ?? null,
          latency: 0,
          finalUrl: String(item.finalUrl || ""),
          checkedAt: new Date(Number(item.checkedAt)).toISOString(),
          message: String(item.message || ""),
          nawala: "unknown",
        })),
      );
      setMonitorLoginReady(Boolean(data.loginReady));
      setMonitorServerReady(true);
      setMonitorError("");
    } catch (error) {
      setMonitorError(
        error instanceof Error ? error.message : "Data monitor gagal dimuat.",
      );
    }
  };

  useEffect(() => {
    const receiveExtensionMessage = (event: MessageEvent) => {
      if (event.source !== window) return;
      const message = event.data;
      if (!message || message.source !== "PREMANKARO_EXTENSION") return;
      if (message.type === "PONG") {
        setMonitorExtensionReady(true);
        setMonitorExtensionWarning(false);
        return;
      }
      if (message.type !== "CAPTURE_RESULT" || !message.requestId) return;
      const pending = monitorCaptureResolvers.current.get(message.requestId);
      if (!pending) return;
      window.clearTimeout(pending.timer);
      monitorCaptureResolvers.current.delete(message.requestId);
      if (message.ok) pending.resolve(message.result);
      else
        pending.reject(
          new Error(message.error || "Extension gagal mengambil screenshot."),
        );
    };
    window.addEventListener("message", receiveExtensionMessage);
    const ping = () =>
      window.postMessage(
        { source: "PREMANKARO_DASHBOARD", type: "PING" },
        window.location.origin,
      );
    ping();
    const pingTimer = window.setInterval(ping, 3_000);
    return () => {
      window.removeEventListener("message", receiveExtensionMessage);
      window.clearInterval(pingTimer);
    };
  }, []);

  const captureWithExtension = (
    category: MonitorCategory,
    shift: "pagi" | "malam",
  ) =>
    new Promise<any>((resolve, reject) => {
      const requestId = crypto.randomUUID();
      const timer = window.setTimeout(() => {
        monitorCaptureResolvers.current.delete(requestId);
        reject(new Error("Extension tidak merespons dalam 90 detik."));
      }, 90_000);
      monitorCaptureResolvers.current.set(requestId, {
        resolve,
        reject,
        timer,
      });
      window.postMessage(
        {
          source: "PREMANKARO_DASHBOARD",
          type: "CAPTURE_PAGE",
          requestId,
          category: {
            id: category.id,
            name: category.name,
            url: category.url,
          },
          shift,
        },
        window.location.origin,
      );
    });

  const saveExtensionScreenshot = async (
    category: MonitorCategory,
    capture: any,
    shift: "pagi" | "malam",
  ) => {
    const response = await fetch("/api/site-monitor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "save-extension-screenshot",
        categoryId: category.id,
        shift,
        imageBase64: String(capture.dataUrl || "").split(",")[1] || "",
        finalUrl: String(capture.finalUrl || category.url),
        title: String(capture.title || ""),
        challenge: Boolean(capture.challenge),
      }),
    });
    const responseText = await response.text();
    let data: any = {};
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new Error(
        `Server HTTP ${response.status}: ${responseText.slice(0, 140) || "respons bukan JSON"}`,
      );
    }
    if (!response.ok)
      throw new Error(data.error || "Screenshot gagal disimpan.");
  };

  const checkLinks = async (
    onlyUrl?: string,
    forcedShift?: "pagi" | "malam",
  ) => {
    if (!monitorExtensionReady) {
      setMonitorExtensionWarning(true);
      return;
    }
    if (monitorRunLock.current) {
      setMonitorError(
        "Proses screenshot sebelumnya masih berjalan. Tunggu hingga selesai.",
      );
      return;
    }
    const selectedShift = forcedShift || monitorShift;
    const category = onlyUrl
      ? monitorCategories.find((item) => item.url === onlyUrl)
      : undefined;
    if (
      !onlyUrl &&
      !monitorCategories.some((item) => item.active && item.url.trim())
    ) {
      setMonitorError("Masukkan minimal satu link.");
      return;
    }
    monitorRunLock.current = true;
    setMonitorChecking(true);
    setMonitorError("");
    try {
      const targets = category
        ? [category]
        : monitorCategories.filter((item) => item.active && item.url.trim());
      const failures: string[] = [];
      for (let index = 0; index < targets.length; index += 1) {
        const target = targets[index];
        setMonitorExtensionProgress(
          `${index + 1}/${targets.length} · ${target.name}`,
        );
        try {
          const capture = await captureWithExtension(target, selectedShift);
          await saveExtensionScreenshot(target, capture, selectedShift);
        } catch (error) {
          failures.push(
            `${target.name}: ${error instanceof Error ? error.message : "gagal"}`,
          );
        }
      }
      await loadMonitor(selectedShift);
      setMonitorLastChecked(new Date().toISOString());
      if (failures.length) setMonitorError(failures.join(" | "));
    } catch (error) {
      setMonitorError(
        error instanceof Error ? error.message : "Pengecekan link gagal.",
      );
    } finally {
      monitorRunLock.current = false;
      setMonitorExtensionProgress("");
      setMonitorChecking(false);
    }
  };

  const saveMonitorCredentials = async () => {
    setMonitorError("");
    const response = await fetch("/api/site-monitor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "save-credentials",
        username: monitorUsername,
        password: monitorPassword,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMonitorError(data.error || "Login gagal disimpan.");
      return;
    }
    setMonitorLoginReady(true);
    setMonitorPassword("");
    setMonitorLoginOpen(false);
  };

  const deleteMonitorResults = async () => {
    await fetch("/api/site-monitor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "delete-results" }),
    });
    setMonitorResults([]);
  };

  useEffect(() => {
    if (kind === "monitor") loadMonitor(monitorShift);
  }, [kind, monitorShift]);

  useEffect(() => {
    if (!monitorServerReady) return;
    const timer = window.setTimeout(async () => {
      const response = await fetch("/api/site-monitor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "save-categories",
          categories: monitorCategories,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setMonitorError(data.error || "Kategori gagal disimpan.");
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [monitorServerReady, monitorCategories]);

  useEffect(() => {
    if (!monitorLoaded) return;
    localStorage.setItem(
      "premankaro-link-monitor",
      JSON.stringify({
        raw: monitorRaw,
        interval: monitorInterval,
        intervalUnit: monitorIntervalUnit,
        auto: monitorAuto,
        nextRunAt: monitorNextRunAt,
        categories: monitorCategories,
        day: getAutomaticDate(),
        results: monitorResults,
        lastChecked: monitorLastChecked,
      }),
    );
  }, [
    monitorLoaded,
    monitorRaw,
    monitorInterval,
    monitorIntervalUnit,
    monitorAuto,
    monitorNextRunAt,
    monitorCategories,
    monitorResults,
    monitorLastChecked,
  ]);

  const monitorIntervalMs = () =>
    Math.max(1, monitorInterval) *
    (monitorIntervalUnit === "hour" ? 3_600_000 : 60_000);

  const saveMonitorSchedule = () => {
    if (!Number.isFinite(monitorInterval) || monitorInterval < 1) {
      setMonitorError("Interval minimal 1 menit atau 1 jam.");
      return;
    }
    const next = monitorAuto
      ? new Date(Date.now() + monitorIntervalMs()).toISOString()
      : "";
    setMonitorNextRunAt(next);
    setMonitorScheduleSaved(true);
    setMonitorError("");
    window.setTimeout(() => setMonitorScheduleSaved(false), 2200);
  };

  useEffect(() => {
    if (!monitorLoaded || !monitorAuto) return;
    if (!monitorNextRunAt) {
      setMonitorNextRunAt(
        new Date(Date.now() + monitorIntervalMs()).toISOString(),
      );
      return;
    }
    const runIfDue = () => {
      if (
        kind !== "monitor" ||
        !monitorExtensionReady ||
        monitorChecking ||
        monitorRunLock.current ||
        Date.now() < new Date(monitorNextRunAt).getTime()
      )
        return;
      // Jadwalkan pemeriksaan berikutnya sebelum mulai agar tidak terpanggil dua kali.
      setMonitorNextRunAt(
        new Date(Date.now() + monitorIntervalMs()).toISOString(),
      );
      checkLinks(undefined, monitorShift);
    };
    runIfDue();
    const timer = window.setInterval(runIfDue, 5_000);
    return () => window.clearInterval(timer);
  }, [
    monitorLoaded,
    monitorAuto,
    monitorNextRunAt,
    monitorInterval,
    monitorIntervalUnit,
    kind,
    monitorExtensionReady,
    monitorChecking,
    monitorShift,
  ]);

  useEffect(() => {
    const clearOldDailyResults = () => {
      try {
        const saved = JSON.parse(
          localStorage.getItem("premankaro-link-monitor") || "{}",
        );
        if (saved.day && saved.day !== getAutomaticDate()) {
          setMonitorResults([]);
          setMonitorLastChecked("");
          localStorage.setItem(
            "premankaro-link-monitor",
            JSON.stringify({
              raw: monitorRaw,
              interval: monitorInterval,
              categories: monitorCategories,
              day: getAutomaticDate(),
              results: [],
              lastChecked: "",
            }),
          );
        }
      } catch {}
    };
    clearOldDailyResults();
    const timer = window.setInterval(clearOldDailyResults, 60_000);
    return () => window.clearInterval(timer);
  }, [monitorRaw, monitorInterval, monitorCategories]);

  const loadFootball = async (theme: "blue" | "black" = footballTheme) => {
    setFootballLoading(true);
    setFootballError("");
    try {
      const response = await fetch(
        `/api/football-predictions?theme=${theme}&refresh=${Date.now()}`,
        { cache: "no-store" },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Data prediksi belum tersedia.");
      setFootballData(data);
    } catch (error) {
      setFootballError(
        error instanceof Error
          ? error.message
          : "Gagal mengambil prediksi bola.",
      );
    } finally {
      setFootballLoading(false);
    }
  };

  useEffect(() => {
    if (kind !== "bola") return;
    loadFootball(footballTheme);
    const timer = window.setInterval(
      () => loadFootball(footballTheme),
      30 * 60 * 1_000,
    );
    return () => window.clearInterval(timer);
  }, [kind, footballTheme]);

  useEffect(() => {
    if (!rgbLoaded) return;
    localStorage.setItem(
      "premankaro-rgb",
      JSON.stringify({
        one: rgbOne,
        two: rgbTwo,
        three: rgbThree,
        speed: rgbSpeed,
      }),
    );
  }, [rgbLoaded, rgbOne, rgbTwo, rgbThree, rgbSpeed]);

  useEffect(() => {
    if (!rgbLoaded) return;
    localStorage.setItem("premankaro-display-mode", displayMode);
    document.documentElement.dataset.theme = displayMode;
    document.documentElement.style.colorScheme = displayMode;
  }, [displayMode, rgbLoaded]);

  useEffect(() => {
    if (!kindLoaded) return;
    localStorage.setItem("premankaro-active-menu", kind);
  }, [kind, kindLoaded]);

  useEffect(() => {
    if (!handoverLoaded) return;
    localStorage.setItem(
      "premankaro-handover-data",
      JSON.stringify(handoverData),
    );
  }, [handoverData, handoverLoaded]);

  useEffect(() => {
    const syncClock = () => setUsdtDateTime(getAutomaticDateTime());
    syncClock();
    const timer = window.setInterval(syncClock, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const syncAutomaticDate = () => {
      const today = getAutomaticDate();
      setForm((old) =>
        old.tanggal === today ? old : { ...old, tanggal: today },
      );
    };
    syncAutomaticDate();
    const timer = window.setInterval(syncAutomaticDate, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const update = (key: keyof FormState) => (value: string) =>
    setForm((old) => ({ ...old, [key]: value }));

  const currentHandoverEntries = handoverData[handoverShift];
  const handoverOutput = `SERAH TERIMA SHIFT ${handoverShift.toUpperCase()}${
    currentHandoverEntries.length
      ? `\n\n${currentHandoverEntries
          .map((entry, index) => `${index + 1}. ${entry.content.trim()}`)
          .join("\n\n")}`
      : ""
  }`;
  const addHandoverEntry = () => {
    const content = handoverDraft.trim();
    if (!content) return;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    setHandoverData((old) => ({
      ...old,
      [handoverShift]: [...old[handoverShift], { id, content }],
    }));
    setHandoverDraft("");
    setHandoverCopied(false);
  };
  const updateHandoverEntry = (id: string, content: string) =>
    setHandoverData((old) => ({
      ...old,
      [handoverShift]: old[handoverShift].map((entry) =>
        entry.id === id ? { ...entry, content } : entry,
      ),
    }));
  const removeHandoverEntry = (id: string) =>
    setHandoverData((old) => ({
      ...old,
      [handoverShift]: old[handoverShift].filter((entry) => entry.id !== id),
    }));
  const moveHandoverEntry = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= currentHandoverEntries.length) return;
    setHandoverData((old) => {
      const entries = [...old[handoverShift]];
      [entries[index], entries[target]] = [entries[target], entries[index]];
      return { ...old, [handoverShift]: entries };
    });
  };
  const copyHandover = async () => {
    if (!currentHandoverEntries.length) return;
    await navigator.clipboard.writeText(handoverOutput);
    setHandoverCopied(true);
    window.setTimeout(() => setHandoverCopied(false), 1800);
  };

  const loadResultTracker = async () => {
    setResultLoading(true);
    setResultError("");
    try {
      const todayResponse = await fetch(`/api/result-tracker?date=${resultActiveDate}&view=current&shioYear=${resultShioYear}`, {
        cache: "no-store",
      });
      const todayData = await todayResponse.json();
      if (!todayResponse.ok)
        throw new Error(todayData.error || "Data result gagal dimuat.");
      setResultMarkets(Array.isArray(todayData.markets) ? todayData.markets : []);
      setTodayResultRecords(
        Array.isArray(todayData.records) ? todayData.records : [],
      );
      setResultShioSettings(Array.isArray(todayData.shioSettings)&&todayData.shioSettings.length===12?todayData.shioSettings:DEFAULT_RESULT_SHIO);
      if (kind !== "resultArchive") {
        setResultArchive([]);
        return;
      }
      const archiveQuery =
        resultFilterMode === "day"
          ? `date=${resultFilterDate}`
          : `month=${resultFilterMonth}&year=${resultFilterYear}`;
      const archiveResponse = await fetch(`/api/result-tracker?${archiveQuery}`, {
        cache: "no-store",
      });
      const archiveData = await archiveResponse.json();
      if (!archiveResponse.ok)
        throw new Error(archiveData.error || "Arsip result gagal dimuat.");
      setResultArchive(Array.isArray(archiveData.records) ? archiveData.records : []);
    } catch (error) {
      setResultError(error instanceof Error ? error.message : "Data result gagal dimuat.");
    } finally {
      setResultLoading(false);
    }
  };

  useEffect(() => {
    if (kind !== "resultTracker" && kind !== "resultArchive") return;
    loadResultTracker();
  }, [kind, resultActiveDate, resultFilterMode, resultFilterDate, resultFilterMonth, resultFilterYear, resultShioYear]);

  useEffect(() => {
    let activeDate = getWibIsoDate();
    const timer = window.setInterval(() => {
      const now = new Date();
      const nextDate = getWibIsoDate(now);
      setResultClock(now);
      if (nextDate !== activeDate) {
        const previousDate = activeDate;
        activeDate = nextDate;
        setResultActiveDate(nextDate);
        setResultFilterMode("day");
        setResultFilterDate(previousDate);
        setTodayResultRecords([]);
        setResultEditor(null);
        setResultInput({ prize1: "", prize2: "", prize3: "", officialLink: "", adminResult: "" });
      }
    }, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const resetTodayResultRecords = async () => {
    if (!window.confirm(`Reset semua HASIL RESULT tanggal ${resultActiveDate}? Nama pasaran dan seluruh jadwal tidak akan dihapus. Hasil tetap tersedia di Arsip Result.`)) return;
    setResultError("");
    const response = await fetch("/api/result-tracker", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "reset-day-results", resultDate: resultActiveDate }),
    });
    const data = await response.json();
    if (!response.ok) return setResultError(data.error || "Semua hasil gagal direset.");
    setTodayResultRecords([]);
    setResultEditor(null);
    setResultFilterMode("day");
    setResultFilterDate(resultActiveDate);
    await loadResultTracker();
  };

  const saveResultMarket = async () => {
    setResultError("");
    const response = await fetch("/api/result-tracker", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "save-market",
        id: resultEditMarket?.id,
        ...resultMarketDraft,
      }),
    });
    const data = await response.json();
    if (!response.ok) return setResultError(data.error || "Pasaran gagal disimpan.");
    setResultEditMarket(null);
    setResultMarketDraft({
      name: "",
      shift: "pagi",
      closeTime: "09:25",
      resultTime: "09:30",
      officialUrl: "",
      active: true,
    });
    await loadResultTracker();
  };

  const editResultMarket = (market: ResultMarket) => {
    setResultEditMarket(market);
    setResultMarketDraft({
      name: market.name,
      shift: market.shift,
      closeTime: market.closeTime,
      resultTime: market.resultTime,
      officialUrl: market.officialUrl,
      active: market.active,
    });
    setResultManageOpen(true);
  };

  const deleteResultMarket = async (market: ResultMarket) => {
    if (!window.confirm(`Hapus pasaran ${market.name} beserta seluruh arsipnya?`)) return;
    const response = await fetch("/api/result-tracker", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "delete-market", id: market.id }),
    });
    const data = await response.json();
    if (!response.ok) return setResultError(data.error || "Pasaran gagal dihapus.");
    await loadResultTracker();
  };

  const openResultEditor = (market: ResultMarket) => {
    const existing = todayResultRecords.find((record) => record.marketId === market.id);
    setResultEditor(market);
    setResultInput({
      prize1: existing?.prize1 || "",
      prize2: existing?.prize2 || "",
      prize3: existing?.prize3 || "",
      officialLink: existing?.officialLink || "",
      adminResult: existing?.adminResult || "",
    });
  };

  const saveResultRecord = async () => {
    if (!resultEditor) return;
    setResultError("");
    const response = await fetch("/api/result-tracker", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "save-result",
        marketId: resultEditor.id,
        resultDate: getWibIsoDate(),
        ...resultInput,
      }),
    });
    const data = await response.json();
    if (!response.ok) return setResultError(data.error || "Result gagal disimpan.");
    setResultEditor(null);
    await loadResultTracker();
  };

  const shioFromPrize=(prize:string)=>{
    const digits=String(prize||"").replace(/\D/g,"");
    if(!digits)return "-";
    const tail=digits.slice(-2).padStart(2,"0");
    return resultShioSettings.find(item=>item.numbers.split(",").map(value=>value.trim().padStart(2,"0")).includes(tail))?.name||"TIDAK DITEMUKAN";
  };
  const resultCopyText=(record:ResultRecord)=>{
    const date=new Date(`${record.resultDate}T12:00:00+07:00`);
    const dateText=new Intl.DateTimeFormat("id-ID",{timeZone:"Asia/Jakarta",weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(date);
    const heading=`HASIL PENGELUARAN ${record.marketName.toUpperCase()}`;
    const footer="Selamat Kepada Pemenang, Salam JP Hanya di TogelUP";
    const hasMultiple=Boolean(record.prize2||record.prize3);
    return hasMultiple
      ? `${heading}\nHari Ini ${dateText.toUpperCase()}\nPrize 1 : ${record.prize1||"-"}\nPrize 2 : ${record.prize2||"-"}\nPrize 3 : ${record.prize3||"-"}\nSHIO : ${shioFromPrize(record.prize1)}\n${footer}`
      : `${heading}\nHari Ini ${dateText.toUpperCase()}\nResult : ${record.prize1||"-"}\nSHIO : ${shioFromPrize(record.prize1)}\n${footer}`;
  };
  const copyResultAnnouncement=async(record:ResultRecord)=>{
    await navigator.clipboard.writeText(resultCopyText(record));
    setResultCopyId(record.id);
    window.setTimeout(()=>setResultCopyId(""),1800);
  };
  const saveResultShioSettings=async()=>{
    setResultError("");
    const response=await fetch("/api/result-tracker",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"save-shio-settings",year:resultShioYear,settings:resultShioSettings})});
    const data=await response.json();
    if(!response.ok)return setResultError(data.error||"Pengaturan shio gagal disimpan.");
    await loadResultTracker();
  };

  const resultStatus = (market: ResultMarket) => {
    const record = todayResultRecords.find((item) => item.marketId === market.id);
    const clock = getWibClockParts(resultClock);
    const nowSeconds = clock.hour * 3600 + clock.minute * 60 + clock.second;
    const closeSeconds = minutesFromClock(market.closeTime) * 60;
    const resultSeconds = minutesFromClock(market.resultTime) * 60;
    if (record && (record.prize1 || record.prize2 || record.prize3 || record.adminResult))
      return { code: "done", text: "✓ SUDAH RESULT", countdown: "Result tersimpan dan siap dicocokkan", breakNote: "" };
    const target = nowSeconds < closeSeconds ? closeSeconds : resultSeconds;
    const remaining = Math.max(0, target - nowSeconds);
    const countdown = `${String(Math.floor(remaining / 3600)).padStart(2, "0")}:${String(Math.floor((remaining % 3600) / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
    const activeRemaining = remaining;
    const breakNote = activeRemaining > 25 * 60
      ? "Waktu result masih di atas jam izin 20 menit, silakan smoke bray."
      : activeRemaining > 0 && activeRemaining <= 20 * 60
        ? "JANGAN NGULAR YA BRAY, BENTAR LAGI RESULT"
        : "";
    const noteType = activeRemaining > 25 * 60 ? "relax" : activeRemaining > 0 && activeRemaining <= 20 * 60 ? "urgent" : "";
    if (nowSeconds < closeSeconds)
      return { code: "open", text: "BELUM RESULT · BET BERJALAN", countdown: `PENDING · Bet tutup dalam ${countdown}`, breakNote, noteType };
    if (nowSeconds < resultSeconds)
      return { code: "waiting", text: "BELUM RESULT · MENUNGGU", countdown: `PENDING · Result dalam ${countdown}`, breakNote, noteType };
    return { code: "due", text: "BELUM RESULT · TERLAMBAT", countdown: `⚠ WAKTU RESULT ${market.name} TELAH TIBA`, breakNote: "" };
  };

  const updateUsdtBlock = (value: string) => {
    setUsdtRaw(value);
    const clean = value.replace(/\u00a0/g, " ");
    const deposit =
      clean.match(/deposit[^0-9]{0,30}([0-9][0-9.,]*)/i)?.[1] ?? "";
    const withdraw =
      clean.match(/withdraw[^0-9]{0,30}([0-9][0-9.,]*)/i)?.[1] ?? "";
    setUsdtDeposit(deposit);
    setUsdtWithdraw(withdraw);
  };

  const validation = useMemo(() => {
    const mask = maskedName.toUpperCase().replace(/[^A-Z]/g, "");
    const original = originalName.toUpperCase().replace(/[^A-Z]/g, "");
    let matched = 0;
    const mismatchPositions: number[] = [];
    const comparisonTotal = Math.max(mask.length, original.length);
    for (let i = 0; i < comparisonTotal; i++) {
      const maskChar = mask[i];
      const originalChar = original[i];
      const isMatch =
        Boolean(maskChar && originalChar) &&
        (maskChar === "X" || maskChar === originalChar);
      if (isMatch) matched++;
      else mismatchPositions.push(i + 1);
    }
    const sameLength = mask.length === original.length;
    const valid =
      comparisonTotal > 0 && sameLength && matched === comparisonTotal;
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
      percentage: comparisonTotal
        ? Math.round((matched / comparisonTotal) * 100)
        : 0,
      valid,
      sameLength,
      shortageMessage,
      mismatchPositions,
    };
  }, [maskedName, originalName]);

  const prompt = useMemo(() => {
    const common = `Buat desain poster ${form.rasio} untuk brand ${form.brand}. Gaya visual ${form.gaya}. Gunakan palet warna ${form.warna}. Komposisi profesional, detail sangat tajam, pencahayaan sinematik, kontras kuat, kualitas iklan premium, siap posting di media sosial.`;
    const endings = `\n\nKetentuan: ${form.catatan} Logo ${form.brand} harus terlihat jelas dan eksklusif. Jangan menambah logo, watermark, atau nama brand lain.`;
    if (kind === "kemenangan")
      return `${common}\n\nGunakan tepat tiga gambar referensi yang saya unggah:\n1. GAMBAR 1 — FOTO WANITA: jadikan sebagai model utama di sisi kiri. Pertahankan kemiripan wajah, bentuk rambut, warna kulit, dan pakaian dari foto asli. Jangan mengganti identitas, jangan membuat wajah baru, dan jangan menambahkan orang lain. Tampilkan setengah badan atau tiga perempat badan dengan pose natural menghadap kamera.\n2. GAMBAR 2 — LOGO SITUS: gunakan logo asli tanpa mengganti tulisan, bentuk, proporsi, atau warna. Letakkan logo secara besar dan jelas di bagian atas poster dengan ruang aman di sekelilingnya. Jangan membuat ulang logo menggunakan teks AI.\n3. GAMBAR 3 — BUKTI TRANSFER: masukkan gambar bukti transfer asli ke dalam layar smartphone premium berukuran besar di sisi kanan. Pertahankan susunan, nominal, tanggal, jam, dan status transaksi dari gambar asli. Jangan mengarang data transaksi. Blur hanya nama bank, nomor rekening, nama pengirim, dan nama penerima untuk privasi; nominal dan status transaksi harus tetap terbaca.\n\nBuat poster bukti kemenangan sederhana tetapi mewah dengan tema visual ${form.tema}. Gunakan headline besar “${form.headline}” dan tampilkan nominal “${form.nominal}” sebagai fokus utama dalam tipografi 3D gold yang sangat menonjol. Cantumkan tanggal posting “${form.tanggal}”. Tambahkan koin emas beterbangan, berlian emerald, partikel cahaya, serta efek kemenangan premium yang menghubungkan model dan smartphone tanpa membuat desain terlalu ramai.\n\nSusunan wajib: logo di atas, model wanita di kiri, smartphone berisi bukti transfer di kanan, headline dan nominal besar di bagian tengah-bawah. Tambahkan empat panel keunggulan di bagian paling bawah: “AMAN TERPERCAYA”, “PROSES CEPAT”, “WIN RATE TINGGI”, dan “CUSTOMER SERVICE 24 JAM”. Jangan menampilkan nama pasaran, angka kemenangan, logo tambahan, watermark, atau orang lain.${endings}`;
    if (kind === "syair")
      return `${common}\n\nBuat poster tabel syair premium yang susunan informasinya mengikuti contoh referensi. Poster untuk pasaran ${form.pasaran}, tanggal ${form.tanggal}, dengan judul utama besar “${form.judulSyair}”. Gunakan tema visual ${form.tema}, tetapi seluruh angka dan teks di bawah harus dipertahankan tepat tanpa diganti, ditambah, dikurangi, atau diacak.\n\nDATA WAJIB:\n- BB 2D, tampilkan vertikal di panel kiri: ${form.bb2d}\n- Angka arah kompas di panel tengah: UTARA/N = ${form.arahUtara}, TIMUR/E = ${form.arahTimur}, SELATAN/S = ${form.arahSelatan}, BARAT/W = ${form.arahBarat}\n- BBFS, tampilkan vertikal di panel kanan: ${form.bbfs}\n- SHIO: ${form.shio}\n- COLOK BEBAS: ${form.colokBebas}\n- TOP 4D, tampilkan sebagai tiga kombinasi terpisah: ${form.top4d}\n\nISI SYAIR WAJIB:\n${form.isiSyair}\n\nSUSUNAN DESAIN WAJIB: header judul di atas; tanggal tepat di bawah judul; panel BB 2D di sisi kiri; kompas N-E-S-W dengan angka masing-masing di tengah; panel BBFS dan ilustrasi shio ${form.shio} di sisi kanan; kotak isi syair di tengah-bawah; lalu baris footer berisi SHIO, COLOK BEBAS, dan TOP 4D. Setiap panel harus memiliki garis pembatas tegas, hierarchy rapi, dan seluruh angka sangat mudah dibaca. Jangan menukar posisi, mengubah angka, membuat angka tambahan, atau mengganti nama shio.${endings}`;
    if (kind === "prediksi")
      return `${common}\n\nGunakan tepat dua gambar referensi yang saya unggah:\n1. GAMBAR 1 — FOTO WANITA: jadikan model utama di sisi kanan poster. Pertahankan kemiripan wajah, rambut, warna kulit, dan pakaian dari foto asli. Jangan mengganti identitas dan jangan menambahkan orang lain.\n2. GAMBAR 2 — LOGO SITUS: gunakan logo situs asli secara besar dan jelas di bagian kiri atas. Jangan mengubah tulisan, bentuk, proporsi, atau warna logo.\n\nCari logo pasaran “${form.pasaran}” melalui Google berdasarkan nama pasaran tersebut, lalu gunakan logo pasaran yang paling resmi dan sesuai. Jika fitur pencarian web tidak tersedia, tampilkan nama pasaran “${form.pasaran}” sebagai logotype premium tanpa menggunakan logo pasaran lain.\n\nBuat poster ANGKA PREDIKSI premium vertikal 4:5 seperti referensi, tanggal ${form.tanggal}. Judul besar wajib “ANGKA PREDIKSI” dan subjudul “${form.pasaran}”. Susun model wanita di kanan, logo situs di kiri atas, tanggal dan logo pasaran di bagian kiri-tengah, serta tabel angka prediksi di kiri-bawah.\n\nDATA ANGKA WAJIB—salin tepat tanpa mengubah, menambah, mengurangi, atau mengacak:\n- BBFS: ${form.predBbfs}\n- ANGKA MAIN: ${form.predAngkaMain}\n- 4D: ${form.pred4d}\n- 3D: ${form.pred3d}\n- 2D: ${form.pred2d}\n- COLOK BEBAS 2D: ${form.predColok2d}\n- COLOK BEBAS: ${form.predColokBebas}\n- SHIO: ${form.predShio}\n\nGunakan tabel berbingkai emas dengan label rata kiri dan angka rata kanan. Tambahkan bola angka dekoratif, koin emas, cahaya kota malam, dan panel “PREDIKSI AKURAT PALING AMAN” tanpa menutupi tabel. Footer dapat berisi PASARAN RESMI, BONUS MEMBER AKTIF, PROSES SUPER CEPAT, dan JACKPOT SIAP DIBAYAR. Semua angka wajib tajam dan mudah dibaca.${endings}`;
    if (kind === "jadwal")
      return `Buat poster promosi pasaran premium vertikal rasio 4:5, ukuran 1080 × 1350 px, hasil HD, tajam, rapi, mudah dibaca, dan siap dipakai untuk postingan WhatsApp.\n\nGunakan satu gambar referensi yang saya unggah:\n1. GAMBAR 1 — LOGO SITUS: gunakan logo situs asli tanpa mengganti tulisan, bentuk, proporsi, atau warnanya. Letakkan logo situs secara jelas di bagian tengah-bawah poster dengan ruang aman di sekelilingnya. Jangan membuat ulang logo menggunakan teks AI.\n\nNama pasaran wajib: “${form.pasaran}”. Cari melalui Google logo resmi pasaran “${form.pasaran}”, identitas visualnya, serta landmark atau ikon lokasi yang paling sesuai dengan pasaran tersebut. Gunakan hasil yang paling relevan sebagai dasar desain. Jika fitur pencarian web tidak tersedia, tampilkan nama “${form.pasaran}” sebagai logotype premium dan gunakan landmark yang umum dikenal, tanpa mengambil logo pasaran lain yang tidak sesuai.\n\nSusunan poster mengikuti referensi:\n- Logo pasaran berada di kiri atas dalam panel putih yang bersih.\n- Panel “24 JAM SERVICE” dengan ikon headset dan jam berada di kanan atas.\n- Nama pasaran “${form.pasaran}” menjadi teks terbesar di tengah, menggunakan tipografi 3D metallic gold dan silver.\n- Gunakan landmark atau panorama kota yang sesuai dengan pasaran sebagai latar utama.\n- Tambahkan elemen bola angka, koin emas, cahaya cyan, kilat halus, dan efek kemenangan premium secukupnya.\n- Logo situs dari gambar referensi berada di tengah-bawah.\n- Footer memiliki lima panel keunggulan: “JACKPOT 100% DIBAYAR”, “24 JAM ONLINE”, “RAHASIA TERJAMIN”, “ENGINE TERBAIK”, dan “18+ TAHUN”.\n\nGunakan palet hitam, deep navy, cyan glow, emerald, metallic gold, dan silver chrome. Komposisi simetris, mewah, sinematik, glossy 3D, kontras kuat, tanpa jadwal lama, tanpa jadwal baru, tanpa tanggal, tanpa angka prediksi, tanpa watermark, dan tanpa nama brand lain.`;
    return common;
  }, [kind, form]);

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const usdtResult = `RATE SEKARANG\nUSDT Ratio Deposit : ${usdtDeposit || "-"}\nUSDT Ratio Withdraw : ${usdtWithdraw || "-"}\nUPDATE : ${usdtDateTime}\n${usdtLinkOne || "-"}\n${usdtLinkTwo || "-"}`;

  const copyUsdtResult = async () => {
    await navigator.clipboard.writeText(usdtResult);
    setUsdtCopied(true);
    window.setTimeout(() => setUsdtCopied(false), 1_600);
  };

  const normalizedMarket =
    resultMarket.trim().replace(/\s+/g, " ").toUpperCase() || "NAMA PASARAN";
  const delayedResultText = `Yth. Member Setia TOGELUP\nKami ingin menginformasikan bahwa untuk Pasaran ${normalizedMarket}\nsaat ini terjadi keterlambatan result dari pihak penyedia belum mengeluarkan angka result.\nMohon kesabarannya menunggu dan untuk estimasi waktu tidak dapat ditentukan. Terima kasih.`;
  const completedResultText = `Yth. Member Setia TOGELUP\nKami ingin menginformasikan bahwa Pasaran ${normalizedMarket} saat ini sudah mengeluarkan angka result.\nMohon maaf atas ketidaknyamanan sebelumnya. Terima kasih.`;

  const copyResultText = async (type: "delay" | "done", text: string) => {
    await navigator.clipboard.writeText(text);
    setResultCopied(type);
    window.setTimeout(() => setResultCopied(null), 1_600);
  };
  const copyFootballScript = async () => {
    if (!footballData?.wpScript) return;
    await navigator.clipboard.writeText(footballData.wpScript);
    setFootballCopied(true);
    window.setTimeout(() => setFootballCopied(false), 1_800);
  };
  const savePrompt = () => {
    const next = [prompt, ...history.filter((x) => x !== prompt)].slice(0, 8);
    setHistory(next);
    localStorage.setItem("prompt-history", JSON.stringify(next));
  };

  const generatePrompt = () => {
    setForm((old) => {
      const generated = {
        ...old,
        tema: pickDifferent(themeBank, old.tema),
        warna: pickDifferent(colorBank, old.warna),
        gaya: pickDifferent(styleBank, old.gaya),
        headline: pickDifferent(headlines[kind], old.headline),
        catatan: pickDifferent(noteBank, old.catatan),
      };
      if (kind === "prediksi")
        return {
          ...generated,
          predBbfs: randomUniqueNumbers(6, 10, 1).join(""),
          predAngkaMain: randomUniqueNumbers(5, 10, 1).join(""),
          pred4d: randomUniqueNumbers(4, 10_000, 4).join(", "),
          pred3d: randomUniqueNumbers(3, 1_000, 3).join(", "),
          pred2d: randomUniqueNumbers(2, 100, 2).join(", "),
          predColok2d: randomUniqueNumbers(3, 100, 2).join(", "),
          predColokBebas: randomUniqueNumbers(2, 10, 1).join(", "),
          predShio: pickDifferent(shioBank, old.predShio),
        };
      if (kind !== "syair") return generated;

      const directions = randomUniqueNumbers(4, 10, 1);
      const nextShio = pickDifferent(shioBank, old.shio);
      return {
        ...generated,
        bb2d: randomUniqueNumbers(4, 100, 2).join(", "),
        arahUtara: directions[0],
        arahTimur: directions[1],
        arahSelatan: directions[2],
        arahBarat: directions[3],
        bbfs: randomUniqueNumbers(2, 10, 1).join(", "),
        colokBebas: randomUniqueNumbers(2, 10, 1).join(", "),
        top4d: randomUniqueNumbers(3, 10_000, 4).join(", "),
        shio: nextShio,
        isiSyair: pickDifferent(syairByShio[nextShio] || syairByShio.KELINCI, old.isiSyair),
      };
    });
    setCopied(false);
  };

  const rgbStyle = {
    "--rgb-1": rgbOne,
    "--rgb-2": rgbTwo,
    "--rgb-3": rgbThree,
    "--rgb-speed": `${rgbSpeed}s`,
  } as React.CSSProperties;

  return (
    <AuthGate>
      <main
        className={
          displayMode === "light"
            ? "shell techFont lightMode"
            : "shell techFont darkMode"
        }
        style={rgbStyle}
      >
        <aside className="sidebar">
          <div className="brand upBrand">
            <img
              className="brandLogo upLogo"
              src="/logo-up-premium-transparent.png"
              alt="Logo UP Premium 3D Bergerak"
            />
          </div>
          <div className="sidebarMenuScroll">
            <p className="navLabel">PROMPT POSTINGAN</p>
            <nav>
              {kinds.slice(0, 4).filter(item=>isMaster||allowedMenus.includes(item.id)).map((item) => (
                <button
                  key={item.id}
                  className={kind === item.id ? "navItem active" : "navItem"}
                  onClick={() => {
                    window.dispatchEvent(
                      new Event("premankaro:close-user-management"),
                    );
                    setKind(item.id);
                  }}
                >
                  <i>{item.icon}</i>
                  <span>
                    <b>{item.label}</b>
                    <small>{item.hint}</small>
                  </span>
                </button>
              ))}
            </nav>
            <p className="navLabel shortcutLabel">SHORTCUT</p>
            <nav>
              {kinds.slice(4).filter(item=>isMaster||allowedMenus.includes(item.id)).map((item) => (
                <button
                  key={item.id}
                  className={kind === item.id ? "navItem active" : "navItem"}
                  onClick={() => {
                    window.dispatchEvent(
                      new Event("premankaro:close-user-management"),
                    );
                    setKind(item.id);
                  }}
                >
                  <i>{item.icon}</i>
                  <span>
                    <b>{item.label}</b>
                    <small>{item.hint}</small>
                  </span>
                </button>
              ))}
            </nav>
            {canManageUsers && (
              <>
                <p className="navLabel shortcutLabel">MASTER</p>
                <nav>
                  <button
                    type="button"
                    className="navItem userManagementNav"
                    onClick={() =>
                      window.dispatchEvent(
                        new Event("premankaro:open-user-management"),
                      )
                    }
                  >
                    <i>♙</i>
                    <span>
                      <b>Kontrol User</b>
                      <small>Persetujuan dan kontrol akun</small>
                    </span>
                  </button>
                </nav>
              </>
            )}
          </div>
        </aside>

        <section className="workspace">
          <header>
            <div>
              <p className="eyebrow">
                PROMPT STUDIO /{" "}
                {kinds.find((x) => x.id === kind)?.label.toUpperCase()}
              </p>
              <p className="sub">
                {kind === "monitor"
                  ? "Kelola kategori, login terenkripsi, dan screenshot otomatis untuk dua shift."
                  : kind === "resultTracker"
                    ? "Pantau jadwal result pagi dan malam, isi hasil, dan buka kembali arsip berdasarkan tanggal."
                  : kind === "resultArchive"
                    ? "Cari arsip hasil result tersimpan tanpa mengganggu pencarian data result hari ini."
                  : kind === "handover"
                    ? "Susun catatan serah terima shift, revisi setiap nomor, lalu salin seluruh hasil."
                  : "Isi detail konten, lalu salin prompt siap pakai ke generator gambar pilihan Anda."}
              </p>
            </div>
            <div className="headerTools">
              <div className="status">
                <span /> ONLINE
              </div>
              <button
                type="button"
                className="modeToggle"
                aria-pressed={displayMode === "light"}
                onClick={() =>
                  setDisplayMode((mode) => (mode === "dark" ? "light" : "dark"))
                }
              >
                {displayMode === "dark" ? "☀ MODE CERAH" : "☾ MODE GELAP"}
              </button>
              <button
                className="rgbToggle"
                onClick={() => setRgbOpen((open) => !open)}
              >
                ◉ ATUR RGB
              </button>
              {rgbOpen && (
                <div className="rgbPanel">
                  <div className="rgbPanelHead">
                    <b>WARNA TEKS RGB</b>
                    <button onClick={() => setRgbOpen(false)}>×</button>
                  </div>
                  <div className="rgbColors">
                    <label>
                      <span>Warna 1</span>
                      <input
                        type="color"
                        value={rgbOne}
                        onChange={(event) => setRgbOne(event.target.value)}
                      />
                    </label>
                    <label>
                      <span>Warna 2</span>
                      <input
                        type="color"
                        value={rgbTwo}
                        onChange={(event) => setRgbTwo(event.target.value)}
                      />
                    </label>
                    <label>
                      <span>Warna 3</span>
                      <input
                        type="color"
                        value={rgbThree}
                        onChange={(event) => setRgbThree(event.target.value)}
                      />
                    </label>
                  </div>
                  <label className="rgbSpeed">
                    <span>Kecepatan: {rgbSpeed} detik</span>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="1"
                      value={rgbSpeed}
                      onChange={(event) =>
                        setRgbSpeed(Number(event.target.value))
                      }
                    />
                  </label>
                  <button
                    className="rgbReset"
                    onClick={() => {
                      setRgbOne("#ff2442");
                      setRgbTwo("#f4c542");
                      setRgbThree("#39ff88");
                      setRgbSpeed(12);
                    }}
                  >
                    Reset Warna
                  </button>
                </div>
              )}
            </div>
          </header>

          <div
            className={
              kind === "monitor"
                ? "grid monitorGrid lexendContent"
                : kind === "resultTracker" || kind === "resultArchive"
                  ? "grid resultTrackerGrid lexendContent"
                : kind === "handover"
                  ? "grid handoverGrid lexendContent"
                : kind === "bola"
                  ? "grid footballGrid lexendContent"
                  : kind === "validasi"
                    ? "grid validationGrid lexendContent"
                    : kind === "usdt" || kind === "result"
                      ? "grid usdtGrid lexendContent"
                      : "grid lexendContent"
            }
          >
            {kind === "resultTracker" ? (
              <section className="resultTrackerStudio">
                <section className="panel resultTrackerHero">
                  <div>
                    <span className="resultTrackerKicker">LIVE RESULT CONTROL</span>
                    <h1>Result Pasaran</h1>
                    <p>Jadwal, pengingat otomatis, input hasil, dan arsip result tersimpan.</p>
                  </div>
                  <div className="resultLiveClock">
                    <small>WAKTU INDONESIA BARAT</small>
                    <b>{new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(resultClock)} WIB</b>
                    <span>{getAutomaticDate()}</span>
                  </div>
                  {canManageUsers && (
                    <button className="ghost" onClick={() => setResultManageOpen((open) => !open)}>
                      ⚙ ATUR PASARAN
                    </button>
                  )}
                  {canManageUsers && (
                    <button className="resultResetAll" onClick={resetTodayResultRecords}>
                      ↻ RESET SEMUA HASIL
                    </button>
                  )}
                </section>

                {resultError && <div className="resultTrackerError">{resultError}</div>}

                {canManageUsers && resultManageOpen && (
                  <section className="panel resultMarketManager">
                    <div className="panelHead">
                      <div><span>01</span><h2>Pengaturan Pasaran</h2></div>
                      <button className="ghost" onClick={() => setResultManageOpen(false)}>Tutup</button>
                    </div>
                    <div className="resultMarketForm">
                      <label><span>Nama Pasaran</span><input value={resultMarketDraft.name} onChange={(event) => setResultMarketDraft((old) => ({ ...old, name: event.target.value }))} placeholder="Contoh: FLORIDAEVE" /></label>
                      <label><span>Shift</span><select value={resultMarketDraft.shift} onChange={(event) => setResultMarketDraft((old) => ({ ...old, shift: event.target.value as "pagi" | "malam" }))}><option value="pagi">SHIFT PAGI</option><option value="malam">SHIFT MALAM</option></select></label>
                      <label><span>Jam Bet Close</span><input type="time" value={resultMarketDraft.closeTime} onChange={(event) => setResultMarketDraft((old) => ({ ...old, closeTime: event.target.value }))} /></label>
                      <label><span>Jam Result</span><input type="time" value={resultMarketDraft.resultTime} onChange={(event) => setResultMarketDraft((old) => ({ ...old, resultTime: event.target.value }))} /></label>
                      <label className="resultOfficialUrl"><span>Link Resmi Pasaran</span><input value={resultMarketDraft.officialUrl} onChange={(event) => setResultMarketDraft((old) => ({ ...old, officialUrl: event.target.value }))} placeholder="https://..." /></label>
                      <label className="resultActiveCheck"><input type="checkbox" checked={resultMarketDraft.active} onChange={(event) => setResultMarketDraft((old) => ({ ...old, active: event.target.checked }))} /><span>Pasaran aktif</span></label>
                      <button className="primary" onClick={saveResultMarket}>{resultEditMarket ? "SIMPAN PERUBAHAN" : "+ TAMBAH PASARAN"}</button>
                      {resultEditMarket && <button className="secondary" onClick={() => { setResultEditMarket(null); setResultMarketDraft({ name: "", shift: "pagi", closeTime: "09:25", resultTime: "09:30", officialUrl: "", active: true }); }}>BATAL EDIT</button>}
                    </div>
                    <div className="resultMarketList">
                      {resultMarkets.map((market) => <div key={market.id}><b>{market.name}</b><span>{market.shift.toUpperCase()}</span><small>Tutup {market.closeTime} · Result {market.resultTime}</small><em className={market.active ? "active" : "off"}>{market.active ? "AKTIF" : "OFF"}</em><button onClick={() => editResultMarket(market)}>Edit</button><button className="danger" onClick={() => deleteResultMarket(market)}>Hapus</button></div>)}
                    </div>
                  </section>
                )}

                <div className="resultDueNotice">
                  {resultMarkets.filter((market) => market.active && resultStatus(market).code === "due").length ? (
                    resultMarkets.filter((market) => market.active && resultStatus(market).code === "due").map((market) => <button key={market.id} onClick={() => openResultEditor(market)}>⚠ SILAKAN RESULT PASARAN <b>{market.name}</b></button>)
                  ) : <span>✓ Belum ada pasaran yang melewati jadwal result tanpa hasil.</span>}
                </div>

                {(["pagi", "malam"] as const).map((shift) => (
                  <section className="resultShiftSection" key={shift}>
                    <div className="resultShiftHead"><div><span>{shift === "pagi" ? "☀" : "☾"}</span><h2>PASARAN {shift.toUpperCase()}</h2></div><b>{resultMarkets.filter((market) => market.active && market.shift === shift).length} PASARAN</b></div>
                    <div className="resultMarketCards">
                      {resultMarkets.filter((market) => market.active && market.shift === shift).length === 0 ? <div className="resultEmpty">Belum ada pasaran Shift {shift.toUpperCase()}.</div> : resultMarkets.filter((market) => market.active && market.shift === shift).map((market) => {
                        const status = resultStatus(market);
                        const record = todayResultRecords.find((item) => item.marketId === market.id);
                        return <article className={`resultMarketCard status-${status.code}`} key={market.id}>
                          <div className="resultMarketCardTop"><div><small>{market.shift.toUpperCase()}</small><h3>{market.name}</h3></div><span>{status.text}</span></div>
                          <div className="resultSchedule"><div><small>BET CLOSE</small><b>{market.closeTime} WIB</b></div><div><small>JADWAL RESULT</small><b>{market.resultTime} WIB</b></div></div>
                          <div className="resultCountdown"><span className="pulseDot"/><b>{status.countdown}</b></div>
                          {status.breakNote && <div className={`resultBreakNote ${status.noteType || ""}`}><span>{status.noteType === "urgent" ? "⚡" : "☕"}</span><div><b>{status.noteType === "urgent" ? "SEBENTAR LAGI RESULT" : "WAKTU SANTAI"}</b><p>{status.breakNote}</p></div></div>}
                          {record && <div className="resultPrizes"><span><small>PRIZE 1</small><b>{record.prize1 || "-"}</b></span><span><small>PRIZE 2</small><b>{record.prize2 || "-"}</b></span><span><small>PRIZE 3</small><b>{record.prize3 || "-"}</b></span></div>}
                          {record?.prize1 && <div className="resultReadyCopy"><small>TEKS HASIL SIAP KIRIM</small><pre>{resultCopyText(record)}</pre><button onClick={()=>copyResultAnnouncement(record)}>{resultCopyId===record.id?"✓ BERHASIL DISALIN":"SALIN HASIL"}</button></div>}
                          <div className="resultCardLinks">{market.officialUrl && <a href={market.officialUrl} target="_blank" rel="noreferrer">↗ SITUS RESMI</a>}{record?.officialLink && <a href={record.officialLink} target="_blank" rel="noreferrer">↗ LINK RESULT</a>}</div>
                          {record?.adminResult && <div className="resultAdminText"><small>HASIL RESULT ADMIN</small>{/^https?:\/\//i.test(record.adminResult.trim()) ? <a href={record.adminResult.trim()} target="_blank" rel="noreferrer">↗ LIHAT HASIL RESULT ADMIN</a> : <p>{record.adminResult}</p>}</div>}
                          <button className={status.code === "due" ? "primary dueButton" : "secondary"} onClick={() => openResultEditor(market)}>{record ? "EDIT HASIL RESULT" : status.code === "due" ? "INPUT HASIL SEKARANG" : "INPUT HASIL"}</button>
                        </article>;
                      })}
                    </div>
                  </section>
                ))}

                {resultEditor && <div className="resultModalBackdrop"><section className="resultModal"><button className="resultModalClose" onClick={() => setResultEditor(null)}>×</button><small>INPUT RESULT HARI INI</small><h2>{resultEditor.name}</h2><p>{getWibIsoDate()} · Result {resultEditor.resultTime} WIB</p><div className="resultPrizeInputs"><label><span>Prize 1</span><input value={resultInput.prize1} onChange={(event) => setResultInput((old) => ({ ...old, prize1: event.target.value }))} /></label><label><span>Prize 2</span><input value={resultInput.prize2} onChange={(event) => setResultInput((old) => ({ ...old, prize2: event.target.value }))} /></label><label><span>Prize 3</span><input value={resultInput.prize3} onChange={(event) => setResultInput((old) => ({ ...old, prize3: event.target.value }))} /></label></div><label><span>Link Resmi Result</span><input value={resultInput.officialLink} onChange={(event) => setResultInput((old) => ({ ...old, officialLink: event.target.value }))} placeholder="https://link-result-resmi..." /></label><label><span>Link / Hasil Result Admin</span><textarea rows={4} value={resultInput.adminResult} onChange={(event) => setResultInput((old) => ({ ...old, adminResult: event.target.value }))} placeholder="Tempel link screenshot hasil admin (https://...) atau keterangan admin..." /></label><button className="primary" onClick={saveResultRecord}>SIMPAN HASIL RESULT</button></section></div>}
              </section>
            ) : kind === "resultArchive" ? (
              <section className="resultArchiveStudio">
                <section className="panel resultTrackerHero resultArchiveHero">
                  <div>
                    <span className="resultTrackerKicker">RESULT HISTORY CENTER</span>
                    <h1>Arsip Hasil Result</h1>
                    <p>Cari kembali hasil pasaran berdasarkan tanggal atau periode bulan dan tahun.</p>
                  </div>
                  <div className="resultLiveClock">
                    <small>WAKTU INDONESIA BARAT</small>
                    <b>{new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(resultClock)} WIB</b>
                    <span>{getAutomaticDate()}</span>
                  </div>
                </section>
                {resultError && <div className="resultTrackerError">{resultError}</div>}
                <section className="panel resultArchivePanel">
                  <div className="panelHead"><div><span>01</span><h2>Cari Arsip Result</h2></div><span className="live">● DATA TERSIMPAN</span></div>
                  <div className="resultFilters">
                    <button className={resultFilterMode === "day" ? "active" : ""} onClick={() => setResultFilterMode("day")}>FILTER TANGGAL</button>
                    <button className={resultFilterMode === "month" ? "active" : ""} onClick={() => setResultFilterMode("month")}>FILTER BULAN & TAHUN</button>
                    {resultFilterMode === "day" ? <input type="date" value={resultFilterDate} onChange={(event) => setResultFilterDate(event.target.value)} /> : <><select value={resultFilterMonth} onChange={(event) => setResultFilterMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option value={index + 1} key={index}>{new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date(2026, index, 1)).toUpperCase()}</option>)}</select><input type="number" min="2020" max="2100" value={resultFilterYear} onChange={(event) => setResultFilterYear(Number(event.target.value))} /></>}
                    <button className="secondary" onClick={loadResultTracker}>{resultLoading ? "MEMUAT..." : "REFRESH DATA"}</button>
                  </div>
                  <div className="resultArchiveSummary"><span><small>TOTAL HASIL</small><b>{resultArchive.length}</b></span><span><small>PASARAN</small><b>{new Set(resultArchive.map((record) => record.marketId)).size}</b></span><span><small>PERIODE</small><b>{resultFilterMode === "day" ? resultFilterDate : `${String(resultFilterMonth).padStart(2, "0")}/${resultFilterYear}`}</b></span></div>
                  <div className="resultArchiveTable"><table><thead><tr><th>TANGGAL</th><th>SHIFT</th><th>PASARAN</th><th>PRIZE 1</th><th>PRIZE 2</th><th>PRIZE 3</th><th>LINK RESMI</th><th>HASIL ADMIN</th><th>UPDATE</th></tr></thead><tbody>{resultArchive.length ? resultArchive.map((record) => <tr key={record.id}><td>{record.resultDate}</td><td>{record.shift.toUpperCase()}</td><td>{record.marketName}</td><td>{record.prize1 || "-"}</td><td>{record.prize2 || "-"}</td><td>{record.prize3 || "-"}</td><td>{record.officialLink ? <a href={record.officialLink} target="_blank" rel="noreferrer">BUKA LINK RESMI</a> : "-"}</td><td>{record.adminResult ? (/^https?:\/\//i.test(record.adminResult.trim()) ? <a href={record.adminResult.trim()} target="_blank" rel="noreferrer">LIHAT HASIL ADMIN</a> : record.adminResult) : "-"}</td><td>{record.updatedByName || "-"}</td></tr>) : <tr><td colSpan={9}>Belum ada arsip pada filter ini.</td></tr>}</tbody></table></div>
                </section>
                <section className="panel resultShioPanel">
                  <div className="panelHead"><div><span>02</span><h2>Pengaturan Shio Tahunan</h2></div><span className="live">● ACUAN SHIO PRIZE 1</span></div>
                  <div className="resultShioToolbar"><label><span>TAHUN SHIO</span><input type="number" min="2020" max="2100" value={resultShioYear} onChange={(event)=>setResultShioYear(Number(event.target.value))}/></label><p>Sistem membaca dua digit terakhir Prize 1. Contoh 1235 dibaca 35 = MONYET.</p></div>
                  <div className="resultShioGrid">{resultShioSettings.map((item,index)=><label key={`${item.name}-${index}`}><input className="shioName" value={item.name} disabled={!canManageUsers} onChange={(event)=>setResultShioSettings(old=>old.map((entry,i)=>i===index?{...entry,name:event.target.value.toUpperCase()}:entry))}/><input value={item.numbers} disabled={!canManageUsers} onChange={(event)=>setResultShioSettings(old=>old.map((entry,i)=>i===index?{...entry,numbers:event.target.value}:entry))}/></label>)}</div>
                  {canManageUsers&&<button className="primary resultShioSave" onClick={saveResultShioSettings}>SIMPAN PENGATURAN SHIO {resultShioYear}</button>}
                </section>
              </section>
            ) : kind === "handover" ? (
              <section className="handoverStudio">
                <section className="panel handoverEditor">
                  <div className="panelHead">
                    <div>
                      <span>01</span>
                      <h2>Data Serah Terima</h2>
                    </div>
                    <button
                      className="ghost handoverClear"
                      onClick={() => {
                        if (!currentHandoverEntries.length) return;
                        if (window.confirm(`Hapus semua data Shift ${handoverShift.toUpperCase()}?`))
                          setHandoverData((old) => ({ ...old, [handoverShift]: [] }));
                      }}
                    >
                      Hapus Shift
                    </button>
                  </div>
                  <div className="handoverBody">
                    <div className="handoverShiftTabs">
                      {(["pagi", "malam"] as HandoverShift[]).map((shift) => (
                        <button
                          key={shift}
                          className={handoverShift === shift ? "active" : ""}
                          onClick={() => {
                            setHandoverShift(shift);
                            setHandoverCopied(false);
                          }}
                        >
                          SHIFT {shift.toUpperCase()}
                          <small>{handoverData[shift].length} data</small>
                        </button>
                      ))}
                    </div>
                    <div className="handoverComposer">
                      <label>
                        <span>DATA BERIKUTNYA · NOMOR {currentHandoverEntries.length + 1}</span>
                        <textarea
                          rows={9}
                          value={handoverDraft}
                          onChange={(event) => setHandoverDraft(event.target.value)}
                          placeholder={"Contoh:\nPENAMBAHAN REKENING BANK KAS KHUSUS TAMPUNG\n\nBANK BRI\nNAMA REKENING : ...\nNO REKENING : ...\nNO HP : ...\n\nhp sudah diambil dan sudah ready"}
                        />
                      </label>
                      <button
                        className="primary handoverAdd"
                        onClick={addHandoverEntry}
                        disabled={!handoverDraft.trim()}
                      >
                        + TAMBAH SEBAGAI NO. {currentHandoverEntries.length + 1}
                      </button>
                    </div>
                    <div className="handoverEntries">
                      {currentHandoverEntries.length === 0 ? (
                        <div className="handoverEmpty">
                          Belum ada data untuk Shift {handoverShift.toUpperCase()}.
                        </div>
                      ) : (
                        currentHandoverEntries.map((entry, index) => (
                          <article className="handoverEntry" key={entry.id}>
                            <div className="handoverEntryTop">
                              <strong>NO. {String(index + 1).padStart(2, "0")}</strong>
                              <div>
                                <button
                                  title="Naikkan urutan"
                                  disabled={index === 0}
                                  onClick={() => moveHandoverEntry(index, -1)}
                                >↑</button>
                                <button
                                  title="Turunkan urutan"
                                  disabled={index === currentHandoverEntries.length - 1}
                                  onClick={() => moveHandoverEntry(index, 1)}
                                >↓</button>
                                <button
                                  className="danger"
                                  onClick={() => removeHandoverEntry(entry.id)}
                                >Hapus</button>
                              </div>
                            </div>
                            <textarea
                              rows={7}
                              value={entry.content}
                              onChange={(event) =>
                                updateHandoverEntry(entry.id, event.target.value)
                              }
                            />
                            <small>Isi nomor ini tetap dapat direvisi kapan saja.</small>
                          </article>
                        ))
                      )}
                    </div>
                  </div>
                </section>
                <section className="panel handoverOutputPanel">
                  <div className="panelHead">
                    <div>
                      <span>02</span>
                      <h2>Hasil Siap Kirim</h2>
                    </div>
                    <span className="live">● LIVE</span>
                  </div>
                  <div className="handoverOutput">
                    <pre>{handoverOutput}</pre>
                  </div>
                  <button
                    className="primary handoverCopy"
                    onClick={copyHandover}
                    disabled={!currentHandoverEntries.length}
                  >
                    {handoverCopied ? "✓ HASIL TERSALIN" : "SALIN SEMUA HASIL"}
                  </button>
                  <div className="quality">
                    <span>✓</span>
                    <div>
                      <b>Nomor tersusun otomatis</b>
                      <small>Perubahan pada data lama langsung masuk ke hasil.</small>
                    </div>
                  </div>
                </section>
              </section>
            ) : kind === "monitor" ? (
              <section className="autoSsStudio">
                <div className="autoSsTitle">
                  <h1>AUTO SS SITUS</h1>
                  <p>
                    Screenshot otomatis semua halaman situs · 2 shift per hari ·
                    gambar + link
                  </p>
                </div>
                <section className="panel autoSsToolbar">
                  <div className="shiftTabs">
                    <button
                      className={monitorShift === "pagi" ? "active" : ""}
                      onClick={() => setMonitorShift("pagi")}
                    >
                      SHIFT PAGI
                    </button>
                    <button
                      className={monitorShift === "malam" ? "active" : ""}
                      onClick={() => setMonitorShift("malam")}
                    >
                      SHIFT MALAM
                    </button>
                  </div>
                  <div className="autoSsActions">
                    <a
                      className="extensionButton"
                      href="/premankaro-auto-ss-extension.zip"
                      download
                    >
                      DOWNLOAD EXTENSION
                    </a>
                    <button onClick={() => setMonitorLoginOpen(true)}>
                      {monitorLoginReady ? "LOGIN SIAP" : "LOGIN"}
                    </button>
                    <button
                      className="ssAll"
                      onClick={() => checkLinks()}
                      disabled={monitorChecking}
                    >
                      {monitorChecking
                        ? monitorExtensionProgress || "MEMERIKSA..."
                        : "SS SEMUA"}
                    </button>
                    <button onClick={() => setMonitorSettingsOpen(true)}>
                      ATUR LINK
                    </button>
                    <button onClick={() => loadMonitor(monitorShift)}>
                      REFRESH
                    </button>
                    <button onClick={deleteMonitorResults}>HAPUS HASIL</button>
                  </div>
                  <div className="extensionStatus">
                    {monitorExtensionReady
                      ? "● EXTENSION CHROME AKTIF · SCREENSHOT BROWSER NORMAL"
                      : "○ EXTENSION BELUM AKTIF · DOWNLOAD DAN PASANG EXTENSION TERLEBIH DAHULU"}
                  </div>
                  <div className="autoSsFilter">
                    <label>
                      TANGGAL HASIL{" "}
                      <input
                        type="date"
                        value={new Date().toLocaleDateString("en-CA", {
                          timeZone: "Asia/Jakarta",
                        })}
                        readOnly
                      />
                    </label>
                    <input
                      type="search"
                      placeholder="Cari kategori situs..."
                      value={monitorSearch}
                      onChange={(event) => setMonitorSearch(event.target.value)}
                    />
                  </div>
                  <div className="autoSsSchedule">
                    <label className="autoSsToggle">
                      <input
                        type="checkbox"
                        checked={monitorAuto}
                        onChange={(event) => {
                          const enabled = event.target.checked;
                          setMonitorAuto(enabled);
                          setMonitorNextRunAt(
                            enabled
                              ? new Date(Date.now() + monitorIntervalMs()).toISOString()
                              : "",
                          );
                        }}
                      />
                      <i />
                      AUTO SS
                    </label>
                    <span>SETIAP</span>
                    <input
                      type="number"
                      min="1"
                      max={monitorIntervalUnit === "hour" ? 168 : 10080}
                      value={monitorInterval}
                      onChange={(event) =>
                        setMonitorInterval(Math.max(1, Number(event.target.value) || 1))
                      }
                    />
                    <select
                      value={monitorIntervalUnit}
                      onChange={(event) =>
                        setMonitorIntervalUnit(
                          event.target.value === "hour" ? "hour" : "minute",
                        )
                      }
                    >
                      <option value="minute">MENIT</option>
                      <option value="hour">JAM</option>
                    </select>
                    <button type="button" onClick={saveMonitorSchedule}>
                      {monitorScheduleSaved ? "TERSIMPAN ✓" : "SIMPAN JADWAL"}
                    </button>
                    <div className="autoSsScheduleInfo">
                      <small>
                        TERAKHIR: {monitorLastChecked
                          ? new Date(monitorLastChecked).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB"
                          : "BELUM ADA"}
                      </small>
                      <small>
                        BERIKUTNYA: {monitorAuto && monitorNextRunAt
                          ? new Date(monitorNextRunAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB"
                          : "-"}
                      </small>
                    </div>
                    <b>{monitorAuto ? "OTOMATIS AKTIF" : "OTOMATIS NONAKTIF"}</b>
                  </div>
                </section>
                {monitorExtensionWarning && (
                  <div
                    className="extensionWarningBackdrop"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="extension-warning-title"
                  >
                    <section className="extensionWarningBox">
                      <div className="extensionWarningIcon">!</div>
                      <small>SYSTEM NOTIFICATION</small>
                      <h2 id="extension-warning-title">
                        EXTENSION BELUM AKTIF
                      </h2>
                      <p>
                        Extension screenshot belum terdeteksi. Silakan download,
                        pasang, dan aktifkan extension SS terlebih dahulu, lalu
                        refresh dashboard.
                      </p>
                      <button onClick={() => setMonitorExtensionWarning(false)}>
                        MENGERTI
                      </button>
                    </section>
                  </div>
                )}
                {monitorError && (
                  <div className="monitorError">{monitorError}</div>
                )}
                <section className="autoSsCards">
                  {monitorCategories
                    .filter(
                      (category) =>
                        category.active &&
                        category.name
                          .toLowerCase()
                          .includes(monitorSearch.toLowerCase()),
                    )
                    .map((category) => {
                      const result = monitorResults.find(
                        (item) => item.categoryId === category.id,
                      );
                      return (
                        <article className="autoSsCard" key={category.id}>
                          <div className="autoSsCardHead">
                            <b>{category.name}</b>
                            <span>{monitorShift.toUpperCase()}</span>
                          </div>
                          <div
                            className={
                              result
                                ? result.status === "safe"
                                  ? "ssViewport checked"
                                  : "ssViewport failed"
                                : "ssViewport"
                            }
                          >
                            {result?.id && result.hasImage && (
                              <button
                                type="button"
                                className="ssThumbnailButton"
                                title="Klik dua kali untuk melihat screenshot penuh"
                                onDoubleClick={() =>
                                  setMonitorPreview({
                                    id: result.id!,
                                    name: category.name,
                                    checkedAt: result.checkedAt,
                                  })
                                }
                                onClick={(event) => event.preventDefault()}
                              >
                                <img
                                  src={`/api/site-monitor?image=${encodeURIComponent(result.id)}&v=${encodeURIComponent(result.checkedAt)}`}
                                  alt={`Screenshot ${category.name}`}
                                />
                                <span>DOUBLE KLIK UNTUK LIHAT</span>
                              </button>
                            )}
                            <strong>
                              {result
                                ? result.status === "safe"
                                  ? "SITUS BERHASIL DICEK"
                                  : "SITUS BERMASALAH"
                                : "Belum ada SS"}
                            </strong>
                            {result && (
                              <small>
                                {result.httpStatus
                                  ? `HTTP ${result.httpStatus}`
                                  : result.message}
                              </small>
                            )}
                          </div>
                          <div className="autoSsCardFoot">
                            <small>
                              {category.login ? "LOGIN" : "TANPA LOGIN"}
                            </small>
                            {result?.id && result.hasImage && (
                              <button
                                className="viewSsButton"
                                onClick={() =>
                                  setMonitorPreview({
                                    id: result.id!,
                                    name: category.name,
                                    checkedAt: result.checkedAt,
                                  })
                                }
                              >
                                LIHAT SS
                              </button>
                            )}
                            <button onClick={() => checkLinks(category.url)}>
                              SS SEKARANG
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  {!monitorCategories.length && (
                    <div className="monitorEmpty">
                      Belum ada kategori. Klik <b>ATUR LINK</b> untuk
                      menambahkan kategori dan URL.
                    </div>
                  )}
                </section>
                {monitorPreview && (
                  <div
                    className="ssPreviewBackdrop"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Screenshot ${monitorPreview.name}`}
                    onClick={() => setMonitorPreview(null)}
                  >
                    <section
                      className="ssPreviewModal"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <header className="ssPreviewHead">
                        <div>
                          <strong>{monitorPreview.name}</strong>
                          <small>Screenshot halaman penuh</small>
                        </div>
                        <a
                          href={`/api/site-monitor?image=${encodeURIComponent(monitorPreview.id)}&v=${encodeURIComponent(monitorPreview.checkedAt)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          BUKA TAB BARU
                        </a>
                        <button onClick={() => setMonitorPreview(null)}>
                          ×
                        </button>
                      </header>
                      <div className="ssPreviewImageWrap">
                        <img
                          src={`/api/site-monitor?image=${encodeURIComponent(monitorPreview.id)}&v=${encodeURIComponent(monitorPreview.checkedAt)}`}
                          alt={`Screenshot penuh ${monitorPreview.name}`}
                        />
                      </div>
                    </section>
                  </div>
                )}
                {monitorLoginOpen && (
                  <div className="autoSsModalBackdrop">
                    <section className="autoSsModal loginModal">
                      <button
                        className="modalClose"
                        onClick={() => setMonitorLoginOpen(false)}
                      >
                        ×
                      </button>
                      <h2>LOGIN SITUS</h2>
                      <p>
                        Akun ini digunakan untuk kategori yang membutuhkan akses
                        login. Password dienkripsi sebelum disimpan ke D1.
                      </p>
                      <label>
                        USERNAME
                        <input
                          value={monitorUsername}
                          onChange={(event) =>
                            setMonitorUsername(event.target.value)
                          }
                        />
                      </label>
                      <label>
                        PASSWORD
                        <input
                          type="password"
                          value={monitorPassword}
                          onChange={(event) =>
                            setMonitorPassword(event.target.value)
                          }
                        />
                      </label>
                      <div>
                        <button onClick={() => setMonitorLoginOpen(false)}>
                          BATAL
                        </button>
                        <button
                          className="save"
                          onClick={saveMonitorCredentials}
                        >
                          SIMPAN LOGIN TERENKRIPSI
                        </button>
                      </div>
                    </section>
                  </div>
                )}
                {monitorSettingsOpen && (
                  <div className="autoSsModalBackdrop">
                    <section className="autoSsModal settingsModal">
                      <button
                        className="modalClose"
                        onClick={() => setMonitorSettingsOpen(false)}
                      >
                        ×
                      </button>
                      <h2>PENGATURAN KATEGORI & LINK</h2>
                      <p>
                        Edit kategori/link atau tambahkan target baru. Daftar
                        tersimpan ke D1 dan dipakai Cron secara otomatis.
                      </p>
                      <div className="addCategory">
                        <input
                          placeholder="Nama kategori baru"
                          value={monitorCategoryName}
                          onChange={(event) =>
                            setMonitorCategoryName(event.target.value)
                          }
                        />
                        <input
                          placeholder="https://alamat-link.com/"
                          value={monitorCategoryUrl}
                          onChange={(event) =>
                            setMonitorCategoryUrl(event.target.value)
                          }
                        />
                        <button
                          onClick={() => {
                            if (
                              !monitorCategoryName.trim() ||
                              !monitorCategoryUrl.trim()
                            )
                              return;
                            setMonitorCategories((old) => [
                              ...old,
                              {
                                id: crypto.randomUUID(),
                                name: monitorCategoryName.trim().toUpperCase(),
                                url: monitorCategoryUrl.trim(),
                                login: false,
                                active: true,
                              },
                            ]);
                            setMonitorCategoryName("");
                            setMonitorCategoryUrl("");
                          }}
                        >
                          TAMBAH KATEGORI
                        </button>
                      </div>
                      <div className="categoryTable">
                        <div className="categoryHeader">
                          <span>KATEGORI</span>
                          <span>URL LINK WEBSITE</span>
                          <span>LOGIN</span>
                          <span>AKTIF</span>
                          <span>AKSI</span>
                        </div>
                        {monitorCategories.map((category) => (
                          <div className="categoryRow" key={category.id}>
                            <input
                              value={category.name}
                              onChange={(event) =>
                                setMonitorCategories((old) =>
                                  old.map((item) =>
                                    item.id === category.id
                                      ? { ...item, name: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <input
                              value={category.url}
                              onChange={(event) =>
                                setMonitorCategories((old) =>
                                  old.map((item) =>
                                    item.id === category.id
                                      ? { ...item, url: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <input
                              type="checkbox"
                              checked={category.login}
                              onChange={(event) =>
                                setMonitorCategories((old) =>
                                  old.map((item) =>
                                    item.id === category.id
                                      ? { ...item, login: event.target.checked }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <input
                              type="checkbox"
                              checked={category.active}
                              onChange={(event) =>
                                setMonitorCategories((old) =>
                                  old.map((item) =>
                                    item.id === category.id
                                      ? {
                                          ...item,
                                          active: event.target.checked,
                                        }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <button
                              onClick={() =>
                                setMonitorCategories((old) =>
                                  old.filter((item) => item.id !== category.id),
                                )
                              }
                            >
                              HAPUS
                            </button>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                )}
              </section>
            ) : kind === "bola" ? (
              <section className="footballStudio">
                <div className="panel footballControls">
                  <div className="footballSource">
                    <small>LINK ACUAN PREDIKSI</small>
                    <a
                      href={
                        footballData?.sourceUrl ||
                        "https://jpkoloni4d.pagesco.de/prediksi-bola-10-11-agustus-2026"
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      ↗ BUKA LINK ACUAN
                    </a>
                    <span>
                      Dashboard mengecek data baru otomatis setiap 30 menit.
                    </span>
                  </div>
                  <div className="footballThemePicker">
                    <small>THEMA</small>
                    <div>
                      <button
                        className={footballTheme === "black" ? "selected" : ""}
                        onClick={() => setFootballTheme("black")}
                      >
                        THEMA BLACK
                      </button>
                      <button
                        className={
                          footballTheme === "blue" ? "selected blue" : ""
                        }
                        onClick={() => setFootballTheme("blue")}
                      >
                        THEMA BLUE
                      </button>
                    </div>
                  </div>
                  <div className="footballActions">
                    <button
                      onClick={() => loadFootball(footballTheme)}
                      disabled={footballLoading}
                    >
                      ⟳ {footballLoading ? "MEMUAT DATA..." : "REFRESH DATA"}
                    </button>
                    <button
                      className="copyWp"
                      onClick={copyFootballScript}
                      disabled={!footballData}
                    >
                      {footballCopied
                        ? "✓ SCRIPT TERSALIN"
                        : "▣ SALIN SCRIPT JADWAL"}
                    </button>
                  </div>
                  {footballData && (
                    <div className="footballStats">
                      <b>{footballData.matchCount} PERTANDINGAN</b>
                      <b>{footballData.leagueCount} LIGA</b>
                      <span>
                        Update:{" "}
                        {new Date(footballData.fetchedAt).toLocaleString(
                          "id-ID",
                          { timeZone: "Asia/Jakarta" },
                        )}{" "}
                        WIB
                      </span>
                    </div>
                  )}
                </div>
                {footballError && (
                  <div className="footballError">
                    <b>DATA BELUM DAPAT DIMUAT</b>
                    <span>{footballError}</span>
                    <button onClick={() => loadFootball(footballTheme)}>
                      COBA LAGI
                    </button>
                  </div>
                )}
                {footballLoading && !footballData && (
                  <div className="footballLoading">
                    Mengambil seluruh prediksi dari sumber…
                  </div>
                )}
                {footballData && (
                  <div
                    className={
                      footballTheme === "black"
                        ? "footballBoard footballWpPreview black"
                        : "footballBoard footballWpPreview blue"
                    }
                  >
                    <img
                      className="footballMainLogo"
                      src="https://cdn.areabermain.club/assets/cdn/az5/2026/05/29/20260529/891d078dfb7eafea9e076c4e6a0c8d44/togelup-togel-hijau-transparan-clean.png"
                      alt="TOGELUP"
                    />
                    <h1>🏆PREDIKSI BOLA TOGELUP🏆</h1>
                    <div className="footballNotice">
                      MATCH: {footballData.matchCount} • SEMUA LIGA • JADWAL
                      TERUPDATE OTOMATIS
                    </div>
                    {footballData.leagues.map((league) => (
                      <section className="footballLeague" key={league.name}>
                        <h2>🏆 {league.name} 🏆</h2>
                        {league.matches.map((match, index) => (
                          <div
                            className="footballMatchCard"
                            key={`${league.name}-${match.home}-${index}`}
                          >
                            <div className="footballClub left">
                              <b>{match.home}</b>
                              <span>
                                {match.home
                                  .replace(/\[[^\]]+\]/g, "")
                                  .trim()
                                  .split(/\s+/)
                                  .slice(0, 2)
                                  .map((word) => word[0])
                                  .join("")}
                              </span>
                            </div>
                            <div className="footballPrediction">
                              <small>PREDICTION</small>
                              <strong>{match.score.replace(/\s+/g, "")}</strong>
                              <time>
                                {match.date} {match.time} WIB
                              </time>
                            </div>
                            <div className="footballClub right">
                              <span>
                                {match.away
                                  .replace(/\[[^\]]+\]/g, "")
                                  .trim()
                                  .split(/\s+/)
                                  .slice(0, 2)
                                  .map((word) => word[0])
                                  .join("")}
                              </span>
                              <b>{match.away}</b>
                            </div>
                          </div>
                        ))}
                      </section>
                    ))}
                  </div>
                )}
              </section>
            ) : kind === "validasi" ? (
              <section className="panel validationPanel">
                <div className="panelHead">
                  <div>
                    <span>01</span>
                    <h2>Pengecekan Validasi Dana</h2>
                  </div>
                  <button
                    className="ghost"
                    onClick={() => {
                      setMaskedName("");
                      setOriginalName("");
                      setValidationReady(false);
                    }}
                  >
                    Reset
                  </button>
                </div>
                <div className="validationIntro">
                  <b>COCOKKAN NAMA SECARA OTOMATIS</b>
                  <p>
                    Huruf <strong>X</strong> dianggap sebagai huruf yang
                    disembunyikan. Spasi dan tanda baca tidak dihitung.
                  </p>
                </div>
                <div className="validationInputs">
                  <Field
                    label="Tempel Nama Tersamarkan"
                    value={maskedName}
                    onChange={(value) => {
                      setMaskedName(value);
                      setValidationReady(false);
                    }}
                    placeholder="Contoh: GARXX GARXXXX"
                  />
                  <Field
                    label="Tempel Nama Asli"
                    value={originalName}
                    onChange={(value) => {
                      setOriginalName(value);
                      setValidationReady(false);
                    }}
                    placeholder="Contoh: GARIN GARNIDA"
                  />
                </div>
                <button
                  className="validateButton"
                  onClick={() => setValidationReady(true)}
                >
                  ✓ Hitung & Cocokkan Huruf
                </button>
                {validationReady && (
                  <div
                    className={
                      validation.valid
                        ? "validationResult success"
                        : "validationResult failed"
                    }
                  >
                    <div className="resultStatus">
                      <span>{validation.valid ? "✓" : "!"}</span>
                      <div>
                        <small>STATUS VALIDASI</small>
                        <b>{validation.valid ? "COCOK" : "TIDAK COCOK"}</b>
                      </div>
                    </div>
                    <div className="adjustedName">
                      <small>HASIL PENYESUAIAN</small>
                      <strong>{validation.adjusted || "—"}</strong>
                    </div>
                    <div className="resultStats">
                      <div>
                        <strong>{validation.maskedTotal}</strong>
                        <span>Nama tersamarkan</span>
                      </div>
                      <div>
                        <strong>{validation.originalTotal}</strong>
                        <span>Nama asli</span>
                      </div>
                      <div
                        className={
                          validation.valid
                            ? "matchCard valid"
                            : "matchCard invalid"
                        }
                      >
                        <strong>
                          {validation.valid ? "COCOK" : "TIDAK COCOK"}
                        </strong>
                        <span>Status</span>
                      </div>
                    </div>
                    <p className="resultSummary">
                      {validation.shortageMessage}
                      {validation.mismatchPositions.length > 0
                        ? ` Posisi tidak cocok atau kosong: ${validation.mismatchPositions.join(", ")}.`
                        : ""}
                    </p>
                  </div>
                )}
              </section>
            ) : kind === "usdt" ? (
              <>
                <section className="panel usdtFormPanel">
                  <div className="panelHead">
                    <div>
                      <span>01</span>
                      <h2>Data Update USDT</h2>
                    </div>
                    <button
                      className="ghost"
                      onClick={() => {
                        setUsdtRaw("");
                        setUsdtDeposit("");
                        setUsdtWithdraw("");
                        setUsdtLinkOne("");
                        setUsdtLinkTwo("");
                      }}
                    >
                      Reset
                    </button>
                  </div>
                  <div className="usdtIntro">
                    <b>TEMPEL BLOK RATE DARI LINE</b>
                    <p>
                      Salin dua baris Deposit dan Withdraw sekaligus, lalu
                      tempel di kolom berikut. Dashboard akan mengambil kedua
                      nominal secara otomatis.
                    </p>
                  </div>
                  <div className="usdtInputs">
                    <div className="wide">
                      <Field
                        label="Tempel Data Ratio Deposit & Withdraw"
                        value={usdtRaw}
                        onChange={updateUsdtBlock}
                        placeholder={
                          "Usdt Ratio Deposit : 17,701\nUsdt Ratio Withdraw : 17,879"
                        }
                        area
                      />
                    </div>
                    <div className="usdtDetected">
                      <small>DEPOSIT TERBACA</small>
                      <strong>{usdtDeposit || "BELUM TERBACA"}</strong>
                    </div>
                    <div className="usdtDetected">
                      <small>WITHDRAW TERBACA</small>
                      <strong>{usdtWithdraw || "BELUM TERBACA"}</strong>
                    </div>
                    <div className="wide">
                      <Field
                        label="Link Screenshot 1"
                        value={usdtLinkOne}
                        onChange={setUsdtLinkOne}
                        placeholder="Tempel link screenshot pertama"
                      />
                    </div>
                    <div className="wide">
                      <Field
                        label="Link Screenshot 2"
                        value={usdtLinkTwo}
                        onChange={setUsdtLinkTwo}
                        placeholder="Tempel link screenshot kedua"
                      />
                    </div>
                  </div>
                  <div className="usdtClock">
                    <span>● LIVE WIB</span>
                    <strong>{usdtDateTime}</strong>
                  </div>
                </section>

                <section className="panel usdtOutputPanel">
                  <div className="panelHead">
                    <div>
                      <span>02</span>
                      <h2>Hasil Siap Salin</h2>
                    </div>
                    <span className="live">● LIVE</span>
                  </div>
                  <div className="usdtResultCard">
                    <pre>{usdtResult}</pre>
                  </div>
                  <button className="usdtCopyButton" onClick={copyUsdtResult}>
                    {usdtCopied ? "✓ HASIL TERSALIN" : "COPY HASIL"}
                  </button>
                  <div className="usdtReady">
                    <span>✓</span>
                    <div>
                      <b>Hasil diperbarui otomatis</b>
                      <small>
                        Perubahan input dan waktu langsung muncul di panel
                        hasil.
                      </small>
                    </div>
                  </div>
                </section>
              </>
            ) : kind === "result" ? (
              <>
                <section className="panel resultFormPanel">
                  <div className="panelHead">
                    <div>
                      <span>01</span>
                      <h2>Nama Pasaran</h2>
                    </div>
                    <button
                      className="ghost"
                      onClick={() => setResultMarket("")}
                    >
                      Reset
                    </button>
                  </div>
                  <div className="resultInfoIntro">
                    <b>BUAT INFORMASI RESULT OTOMATIS</b>
                    <p>
                      Masukkan nama pasaran satu kali. Kedua format informasi
                      akan langsung diperbarui dan siap disalin.
                    </p>
                  </div>
                  <div className="resultMarketInput">
                    <Field
                      label="Nama Pasaran"
                      value={resultMarket}
                      onChange={setResultMarket}
                      placeholder="Contoh: KENTUCKYEVE"
                    />
                  </div>
                  <div className="resultMarketPreview">
                    <small>PASARAN AKTIF</small>
                    <strong>{normalizedMarket}</strong>
                  </div>
                </section>

                <section className="resultMessageStack">
                  <article className="panel resultMessageCard delayCard">
                    <div className="resultMessageHead">
                      <div>
                        <span>01</span>
                        <b>PASARAN KETERLAMBATAN</b>
                      </div>
                      <span className="delayBadge">TERLAMBAT</span>
                    </div>
                    <pre>{delayedResultText}</pre>
                    <button
                      onClick={() => copyResultText("delay", delayedResultText)}
                    >
                      {resultCopied === "delay"
                        ? "✓ HASIL TERSALIN"
                        : "COPY HASIL KETERLAMBATAN"}
                    </button>
                  </article>
                  <article className="panel resultMessageCard doneCard">
                    <div className="resultMessageHead">
                      <div>
                        <span>02</span>
                        <b>PASARAN SUDAH RESULT</b>
                      </div>
                      <span className="doneBadge">SUDAH RESULT</span>
                    </div>
                    <pre>{completedResultText}</pre>
                    <button
                      onClick={() =>
                        copyResultText("done", completedResultText)
                      }
                    >
                      {resultCopied === "done"
                        ? "✓ HASIL TERSALIN"
                        : "COPY HASIL SUDAH RESULT"}
                    </button>
                  </article>
                </section>
              </>
            ) : (
              <>
                <section className="panel formPanel">
                  <div className="panelHead">
                    <div>
                      <span>01</span>
                      <h2>Detail Konten</h2>
                    </div>
                    <button
                      className="ghost"
                      onClick={() =>
                        setForm({ ...initial, tanggal: getAutomaticDate() })
                      }
                    >
                      Reset
                    </button>
                  </div>
                  {kind === "kemenangan" && (
                    <div className="referenceGuide">
                      <b>3 GAMBAR REFERENSI UNTUK AI</b>
                      <span>
                        <i>1</i> Foto wanita
                      </span>
                      <span>
                        <i>2</i> Logo situs
                      </span>
                      <span>
                        <i>3</i> Bukti transfer
                      </span>
                      <small>
                        Unggah ketiganya bersama prompt hasil generator.
                      </small>
                    </div>
                  )}
                  {kind === "prediksi" && (
                    <div className="referenceGuide predictionGuide">
                      <b>2 GAMBAR REFERENSI UNTUK AI</b>
                      <span>
                        <i>1</i> Foto wanita
                      </span>
                      <span>
                        <i>2</i> Logo situs
                      </span>
                      <small>
                        Logo pasaran akan diminta berdasarkan nama pasaran yang
                        Anda isi.
                      </small>
                    </div>
                  )}
                  {kind === "jadwal" && (
                    <div className="referenceGuide marketGuide">
                      <b>1 GAMBAR REFERENSI UNTUK AI</b>
                      <span>
                        <i>1</i> Logo situs
                      </span>
                      <small>
                        Logo dan visual pasaran akan diminta berdasarkan nama
                        pasaran yang Anda isi.
                      </small>
                    </div>
                  )}
                  {kind === "syair" && (
                    <div className="syairGuide">
                      <b>FORMAT SYAIR LENGKAP</b>
                      <span>BB 2D</span>
                      <span>Kompas N–E–S–W</span>
                      <span>BBFS</span>
                      <span>SHIO</span>
                      <span>COLOK BEBAS</span>
                      <span>TOP 4D</span>
                      <small>
                        Tekan Generate Prompt untuk mendapatkan angka dan shio
                        baru secara otomatis.
                      </small>
                    </div>
                  )}
                  <div className="formGrid">
                    {kind !== "prediksi" && kind !== "jadwal" && (
                      <Field
                        label="Nama Brand"
                        value={form.brand}
                        onChange={update("brand")}
                      />
                    )}
                    {kind !== "kemenangan" &&
                      (kind === "jadwal" ? (
                        <div className="wide">
                          <Field
                            label="Nama Pasaran"
                            value={form.pasaran}
                            onChange={update("pasaran")}
                            placeholder="Contoh: SINGAPORE TOTO"
                          />
                        </div>
                      ) : (
                        <Field
                          label="Nama Pasaran"
                          value={form.pasaran}
                          onChange={update("pasaran")}
                        />
                      ))}
                    {kind !== "jadwal" && (
                      <Field
                        label="Tanggal Posting (Otomatis)"
                        value={form.tanggal}
                        onChange={update("tanggal")}
                        readOnly
                      />
                    )}
                    {kind === "syair" && (
                      <>
                        <Field
                          label="Judul Syair"
                          value={form.judulSyair}
                          onChange={update("judulSyair")}
                        />
                        <Field
                          label="BB 2D (Otomatis)"
                          value={form.bb2d}
                          onChange={update("bb2d")}
                          readOnly
                        />
                        <div className="wide syairSectionTitle">
                          ANGKA ARAH KOMPAS
                        </div>
                        <Field
                          label="Utara / N (Otomatis)"
                          value={form.arahUtara}
                          onChange={update("arahUtara")}
                          readOnly
                        />
                        <Field
                          label="Timur / E (Otomatis)"
                          value={form.arahTimur}
                          onChange={update("arahTimur")}
                          readOnly
                        />
                        <Field
                          label="Selatan / S (Otomatis)"
                          value={form.arahSelatan}
                          onChange={update("arahSelatan")}
                          readOnly
                        />
                        <Field
                          label="Barat / W (Otomatis)"
                          value={form.arahBarat}
                          onChange={update("arahBarat")}
                          readOnly
                        />
                        <Field
                          label="BBFS (Otomatis)"
                          value={form.bbfs}
                          onChange={update("bbfs")}
                          readOnly
                        />
                        <Field
                          label="Shio (Otomatis)"
                          value={form.shio}
                          onChange={update("shio")}
                          readOnly
                        />
                        <Field
                          label="Colok Bebas (Otomatis)"
                          value={form.colokBebas}
                          onChange={update("colokBebas")}
                          readOnly
                        />
                        <Field
                          label="TOP 4D (Otomatis)"
                          value={form.top4d}
                          onChange={update("top4d")}
                          readOnly
                        />
                        <div className="wide">
                          <Field
                            label="Isi Syair (Otomatis Sesuai Shio)"
                            value={form.isiSyair}
                            onChange={update("isiSyair")}
                            area
                            readOnly
                          />
                        </div>
                      </>
                    )}
                    {kind === "kemenangan" && (
                      <>
                        <Field
                          label="Headline"
                          value={form.headline}
                          onChange={update("headline")}
                        />
                        <Field
                          label="Nominal Kemenangan"
                          value={form.nominal}
                          onChange={update("nominal")}
                        />
                      </>
                    )}
                    {kind === "prediksi" && (
                      <>
                        <div className="wide predictionAutoTitle">
                          ANGKA PREDIKSI OTOMATIS
                        </div>
                        <Field
                          label="BBFS"
                          value={form.predBbfs}
                          onChange={update("predBbfs")}
                          readOnly
                        />
                        <Field
                          label="Angka Main"
                          value={form.predAngkaMain}
                          onChange={update("predAngkaMain")}
                          readOnly
                        />
                        <Field
                          label="4D"
                          value={form.pred4d}
                          onChange={update("pred4d")}
                          readOnly
                        />
                        <Field
                          label="3D"
                          value={form.pred3d}
                          onChange={update("pred3d")}
                          readOnly
                        />
                        <Field
                          label="2D"
                          value={form.pred2d}
                          onChange={update("pred2d")}
                          readOnly
                        />
                        <Field
                          label="Colok Bebas 2D"
                          value={form.predColok2d}
                          onChange={update("predColok2d")}
                          readOnly
                        />
                        <Field
                          label="Colok Bebas"
                          value={form.predColokBebas}
                          onChange={update("predColokBebas")}
                          readOnly
                        />
                        <Field
                          label="Shio"
                          value={form.predShio}
                          onChange={update("predShio")}
                          readOnly
                        />
                      </>
                    )}
                    {(kind === "kemenangan" || kind === "syair") && (
                      <Field
                        label="Tema / Karakter Visual"
                        value={form.tema}
                        onChange={update("tema")}
                      />
                    )}
                    {kind !== "prediksi" && kind !== "jadwal" && (
                      <>
                        <Field
                          label="Palet Warna"
                          value={form.warna}
                          onChange={update("warna")}
                        />
                        <Field
                          label="Ukuran / Rasio"
                          value={form.rasio}
                          onChange={update("rasio")}
                        />
                        <Field
                          label="Gaya Desain"
                          value={form.gaya}
                          onChange={update("gaya")}
                        />
                        <div className="wide">
                          <Field
                            label="Catatan Tambahan"
                            value={form.catatan}
                            onChange={update("catatan")}
                            area
                          />
                        </div>
                      </>
                    )}
                  </div>
                </section>

                <section className="panel outputPanel">
                  <div className="panelHead">
                    <div>
                      <span>02</span>
                      <h2>Prompt Siap Pakai</h2>
                    </div>
                    <span className="live">● LIVE</span>
                  </div>
                  <div className="promptBox">
                    <div className="promptTop">
                      <span>GENERATED PROMPT</span>
                      <span>{prompt.length} karakter</span>
                    </div>
                    <p>{prompt}</p>
                  </div>
                  <div className="actions triple">
                    <button className="generate" onClick={generatePrompt}>
                      ✦ Generate Prompt
                    </button>
                    <button className="primary" onClick={copyPrompt}>
                      {copied ? "✓ Tersalin" : "Salin Prompt"}
                    </button>
                    <button className="secondary" onClick={savePrompt}>
                      Simpan
                    </button>
                  </div>
                  <div className="quality">
                    <span>✓</span>
                    <div>
                      <b>Prompt sudah dioptimalkan</b>
                      <small>
                        Struktur, visual, teks, dan batasan sudah lengkap.
                      </small>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>

          {kind !== "validasi" &&
            kind !== "usdt" &&
            kind !== "result" &&
            kind !== "monitor" &&
            kind !== "handover" &&
            kind !== "resultTracker" &&
            kind !== "resultArchive" &&
            history.length > 0 && (
              <section className="history">
                <div className="historyTitle">
                  <h2>Riwayat Prompt</h2>
                  <button
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem("prompt-history");
                    }}
                  >
                    Hapus semua
                  </button>
                </div>
                <div className="historyGrid">
                  {history.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => navigator.clipboard.writeText(item)}
                    >
                      <span>#{String(i + 1).padStart(2, "0")}</span>
                      <p>{item}</p>
                      <b>Salin</b>
                    </button>
                  ))}
                </div>
              </section>
            )}
        </section>
        <style>{`
          .ssThumbnailButton{position:relative;display:block;width:100%;max-width:100%;padding:0;overflow:hidden;border:1px solid rgba(104,224,183,.5);border-radius:9px;background:#03090c;cursor:zoom-in}
          .shell{--emerald:#00cfff;--gold:#ffe100;--lime:#43ffc1;--line:rgba(0,211,255,.22);--muted:#a5c6cd;background:radial-gradient(circle at 82% 0%,rgba(0,181,255,.2),transparent 35%),radial-gradient(circle at 58% 80%,rgba(255,225,0,.09),transparent 31%),repeating-linear-gradient(135deg,rgba(0,220,255,.018) 0 1px,transparent 1px 8px),#02080b}
          .shell::before{background:conic-gradient(from 0deg,transparent 0 8%,#00d9ff 17%,transparent 29%,#ffe600 41%,transparent 53%,#00ffa8 65%,transparent 76%,#00a8ff 88%,transparent 100%)}
          .shell .sidebar{border-color:rgba(0,211,255,.3);background:linear-gradient(180deg,rgba(2,13,18,.98),rgba(1,5,8,.98));box-shadow:16px 0 55px rgba(0,0,0,.48),4px 0 24px rgba(0,207,255,.06)}
          .shell .panel,.shell .autoSsToolbar,.shell .autoSsCard{border-color:rgba(0,207,255,.25);background:linear-gradient(145deg,rgba(7,24,31,.97),rgba(3,10,14,.98));box-shadow:0 22px 55px rgba(0,0,0,.38),inset 0 1px rgba(255,230,0,.03)}
          .shell .navItem:hover,.shell .navItem.active{border-color:rgba(0,217,255,.38);background:linear-gradient(90deg,rgba(0,194,255,.17),rgba(255,230,0,.055))}.shell .navItem.active i{color:#001015;background:linear-gradient(145deg,#ffe600,#00d9ff);box-shadow:0 0 20px rgba(0,217,255,.28)}
          .shell .primary,.shell .validateButton{color:#001116;background:linear-gradient(135deg,#00d9ff,#00a8d7);box-shadow:0 12px 34px rgba(0,207,255,.2)}.shell .generate{color:#101000;background:linear-gradient(135deg,#fff27a,#ffe100)}
          .shell .field input,.shell .field textarea{border-color:rgba(0,207,255,.19);background:rgba(1,10,14,.78)}.shell .field input:focus,.shell .field textarea:focus{border-color:rgba(0,220,255,.62);box-shadow:0 0 0 3px rgba(0,211,255,.09)}
          .upBrand{position:relative;height:248px;display:block!important;padding:12px;perspective:1100px;isolation:isolate;overflow:hidden;background:radial-gradient(circle at 28% 48%,rgba(255,230,0,.18),transparent 38%),radial-gradient(circle at 72% 48%,rgba(0,217,255,.2),transparent 42%),linear-gradient(145deg,#02090c,#000)!important;border-color:rgba(0,213,255,.36)!important;box-shadow:0 18px 48px rgba(0,0,0,.58),0 0 28px rgba(0,213,255,.1)!important}
          .upBrand::before{z-index:0;inset:8px;border-color:rgba(255,230,0,.18);box-shadow:inset 0 0 35px #000,0 0 20px rgba(0,217,255,.12);animation:upFrameGlow 4.5s ease-in-out infinite}.upBrand::after{z-index:6;left:10%;right:10%;height:2px;background:linear-gradient(90deg,transparent,#ffe600,#00d9ff,#00ffa8,transparent);background-size:240% 100%;animation:upEnergyLine 3.4s linear infinite}
          .upLogo{position:absolute!important;z-index:4;left:50%;top:50%;display:block;width:84%!important;height:84%!important;max-width:214px!important;max-height:214px!important;margin:0!important;object-fit:contain!important;object-position:center center!important;transform-origin:center center;transform-style:preserve-3d;backface-visibility:visible;animation:upLogoFullRotate 5s linear infinite!important;filter:contrast(1.08) saturate(1.2) drop-shadow(0 14px 18px rgba(0,0,0,.65)) drop-shadow(0 0 10px rgba(0,217,255,.3)) drop-shadow(0 0 16px rgba(255,230,0,.16))!important;will-change:transform,filter}
          @keyframes upLogoFullRotate{0%{transform:translate(-50%,-50%) perspective(1000px) rotateY(0deg) scale(.96);filter:contrast(1.1) saturate(1.25) brightness(1.04) drop-shadow(0 0 12px #00d9ff)}25%{transform:translate(-50%,-50%) perspective(1000px) rotateY(90deg) scale(1);filter:contrast(1.14) saturate(1.38) brightness(1.14) drop-shadow(0 0 18px #ffe600)}50%{transform:translate(-50%,-50%) perspective(1000px) rotateY(180deg) scale(.96);filter:contrast(1.1) saturate(1.25) brightness(1.05) drop-shadow(0 0 13px #00ffa8)}75%{transform:translate(-50%,-50%) perspective(1000px) rotateY(270deg) scale(1);filter:contrast(1.14) saturate(1.38) brightness(1.14) drop-shadow(0 0 18px #00d9ff)}100%{transform:translate(-50%,-50%) perspective(1000px) rotateY(360deg) scale(.96);filter:contrast(1.1) saturate(1.25) brightness(1.04) drop-shadow(0 0 12px #ffe600)}}
          @keyframes upFrameGlow{50%{border-color:rgba(0,255,168,.34);box-shadow:inset 0 0 42px #000,0 0 26px rgba(0,217,255,.2)}}@keyframes upEnergyLine{to{background-position:240% 0}}
          .autoSsActions .extensionButton{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 20px;border:1px solid #586472;border-radius:10px;color:#d9dee4;background:#242c36;font-size:9px;font-weight:900;text-decoration:none}
          .autoSsSchedule{flex-wrap:wrap;gap:10px}.autoSsSchedule input[type=number]{width:84px}.autoSsSchedule select{min-height:38px;padding:0 34px 0 12px;border:1px solid #4a5664;border-radius:8px;color:#fff;background:#17212d;font-family:"Lexend",Arial,sans-serif;font-size:8px;font-weight:900}.autoSsToggle{cursor:pointer}.autoSsToggle input{position:absolute;opacity:0;pointer-events:none}.autoSsToggle i{position:relative;width:42px;height:23px;border:1px solid #5c6874;border-radius:99px;background:#24313b;transition:.2s}.autoSsToggle i::after{content:"";position:absolute;left:3px;top:3px;width:15px;height:15px;border-radius:50%;background:#8998a1;transition:.2s}.autoSsToggle input:checked+i{border-color:#31e5ab;background:#126a54;box-shadow:0 0 16px rgba(49,229,171,.25)}.autoSsToggle input:checked+i::after{transform:translateX(19px);background:#45ffc0;box-shadow:0 0 9px #45ffc0}.autoSsScheduleInfo{display:flex;flex-wrap:wrap;gap:6px 16px;min-width:280px}.autoSsScheduleInfo small{color:#9bacb5;font-size:7px;font-weight:800}.autoSsSchedule>button{min-width:126px}.autoSsSchedule>b{min-width:132px;text-align:right}.autoSsSchedule:has(.autoSsToggle input:not(:checked))>b{color:#ff7d8c}.autoSsSchedule:has(.autoSsToggle input:checked)>b{color:#56e4a7}
          .extensionWarningBackdrop{position:fixed;z-index:10050;inset:0;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.78);backdrop-filter:blur(8px)}
          .extensionWarningBox{position:relative;width:min(460px,94vw);padding:28px 32px 30px;border:1px solid rgba(255,214,91,.45);border-radius:20px;text-align:center;color:#fff;background:radial-gradient(circle at 50% 0,rgba(255,215,86,.12),transparent 38%),linear-gradient(145deg,#121d28,#071019);box-shadow:0 30px 100px #000,0 0 36px rgba(255,210,66,.1)}
          .extensionWarningIcon{width:54px;height:54px;margin:0 auto 14px;display:grid;place-items:center;border:1px solid #d6ae4d;border-radius:15px;color:#ffe18a;background:linear-gradient(145deg,rgba(209,161,54,.25),rgba(255,220,111,.07));box-shadow:0 0 24px rgba(255,210,66,.13);font-size:25px;font-weight:900}
          .extensionWarningBox small{display:block;color:#d4b85d;font-size:8px;font-weight:900;letter-spacing:.22em}.extensionWarningBox h2{margin:9px 0 8px;color:#fff!important;-webkit-text-fill-color:#fff!important;background:none!important;font-family:"Lexend","Nunito",Arial,sans-serif!important;font-size:24px!important;font-weight:900!important;letter-spacing:.02em;text-shadow:0 0 20px rgba(255,255,255,.14);animation:none!important}.extensionWarningBox p{max-width:370px;margin:0 auto;color:#d6e0e5;font-family:"Lexend","Nunito",Arial,sans-serif;font-size:11px;line-height:1.65}.extensionWarningBox button{min-width:145px;margin-top:21px;padding:13px 20px;border:1px solid #e5bd58;border-radius:10px;color:#fff;background:linear-gradient(135deg,#a97925,#e1b84f);box-shadow:0 10px 28px rgba(222,177,65,.22);font-family:"Lexend","Nunito",Arial,sans-serif;font-size:11px;font-weight:900}.extensionWarningBox button:hover{filter:brightness(1.12);transform:translateY(-1px)}
          .ssThumbnailButton img{display:block;width:100%;height:138px;object-fit:cover;object-position:top center;background:#05090c}
          .ssThumbnailButton span{position:absolute;right:7px;bottom:7px;padding:5px 8px;border-radius:5px;color:#ffe394;background:rgba(5,8,10,.88);font-size:7px;font-weight:900;letter-spacing:.04em;box-shadow:0 3px 12px #000}
          .autoSsCardFoot{gap:6px}.autoSsCardFoot small{margin-right:auto}.autoSsCardFoot .viewSsButton{color:#dfffee;border-color:#42b98a;background:#103d30}
          .resultTrackerGrid{display:block!important;max-width:1480px}.resultTrackerStudio{display:grid;gap:18px}.resultTrackerHero{display:flex;align-items:center;gap:28px;padding:24px 28px}.resultTrackerHero>div:first-child{margin-right:auto}.resultTrackerKicker{color:#57f2c0;font-size:8px;font-weight:900;letter-spacing:.2em}.resultTrackerHero h1{margin:6px 0 3px;font-size:32px}.resultTrackerHero p{margin:0;color:#95abb2;font-size:11px}.resultLiveClock{display:grid;min-width:235px;padding:13px 18px;border:1px solid rgba(0,217,255,.25);border-radius:12px;background:#031016}.resultLiveClock small{color:#6f939c;font-size:7px}.resultLiveClock b{margin:4px 0;color:#ffe600;font-size:20px}.resultLiveClock span{color:#b5ced4;font-size:8px}.resultTrackerError{padding:14px 18px;border:1px solid #9e3041;border-radius:10px;color:#ff96a4;background:#35121a;font-size:10px;font-weight:800}.resultMarketManager{overflow:hidden}.resultMarketForm{display:grid;grid-template-columns:1.2fr .8fr .75fr .75fr 2fr auto auto auto;gap:10px;align-items:end;padding:20px}.resultMarketForm label{display:grid;gap:7px}.resultMarketForm label span{color:#91abb2;font-size:8px;font-weight:800}.resultMarketForm input,.resultMarketForm select,.resultFilters input,.resultFilters select,.resultModal input,.resultModal textarea{min-height:42px;border:1px solid rgba(0,207,255,.25);border-radius:8px;padding:0 11px;color:#ecffff;background:#020b0f;font:700 10px "Lexend",Arial,sans-serif}.resultMarketForm button{min-height:42px}.resultActiveCheck{display:flex!important;align-items:center;gap:7px;min-width:92px}.resultActiveCheck input{min-height:auto;width:18px;height:18px}.resultMarketList{display:grid;border-top:1px solid rgba(0,207,255,.17)}.resultMarketList>div{display:grid;grid-template-columns:1.2fr .6fr 1.4fr .5fr auto auto;gap:10px;align-items:center;padding:10px 20px;border-bottom:1px solid rgba(0,207,255,.11)}.resultMarketList b{color:#fff;font-size:10px}.resultMarketList span,.resultMarketList small{color:#93aab0;font-size:8px}.resultMarketList em{font-style:normal;font-size:7px;font-weight:900}.resultMarketList em.active{color:#49f3b7}.resultMarketList em.off{color:#ff8190}.resultMarketList button{padding:7px 10px;border:1px solid #36515a;border-radius:6px;color:#dffaff;background:#102229;font-size:7px;font-weight:900}.resultMarketList button.danger{border-color:#7a2e3b;color:#ff9dab;background:#2f1118}.resultDueNotice{display:flex;flex-wrap:wrap;gap:9px}.resultDueNotice button,.resultDueNotice>span{padding:13px 17px;border:1px solid #a83c4b;border-radius:10px;color:#ffd4da;background:linear-gradient(135deg,#44131c,#230b10);font:800 10px "Lexend",Arial,sans-serif}.resultDueNotice>span{border-color:rgba(0,207,255,.2);color:#75dcb9;background:#07181a}.resultShiftSection{display:grid;gap:12px}.resultShiftHead{display:flex;align-items:center;justify-content:space-between;padding:0 4px}.resultShiftHead>div{display:flex;align-items:center;gap:10px}.resultShiftHead span{font-size:21px}.resultShiftHead h2{margin:0;font-size:20px}.resultShiftHead>b{padding:7px 10px;border:1px solid rgba(0,207,255,.2);border-radius:7px;color:#89aab1;font-size:8px}.resultMarketCards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.resultMarketCard{display:grid;gap:12px;padding:16px;border:1px solid rgba(0,207,255,.22);border-radius:14px;background:linear-gradient(145deg,#071b22,#020a0e);box-shadow:0 15px 35px rgba(0,0,0,.24)}.resultMarketCard.status-due{border-color:#ef5368;box-shadow:0 0 24px rgba(239,83,104,.11)}.resultMarketCard.status-done{border-color:#26c98f}.resultMarketCardTop{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.resultMarketCardTop small{color:#d5b23e;font-size:7px;font-weight:900}.resultMarketCardTop h3{margin:4px 0 0;color:#fff;font-size:15px}.resultMarketCardTop>span{max-width:52%;padding:5px 7px;border-radius:6px;color:#ff9aa7;background:#35141a;text-align:center;font-size:6px;font-weight:900}.status-done .resultMarketCardTop>span{color:#58e6b3;background:#0d362b}.status-open .resultMarketCardTop>span{color:#a8ebff;background:#0d2932}.resultSchedule,.resultPrizes{display:grid;grid-template-columns:1fr 1fr;gap:7px}.resultSchedule>div,.resultPrizes>span{display:grid;padding:9px;border:1px solid rgba(0,207,255,.13);border-radius:8px;background:#031015}.resultSchedule small,.resultPrizes small,.resultAdminText small{color:#6f929a;font-size:6px;font-weight:900}.resultSchedule b{margin-top:3px;color:#ffe600;font-size:10px}.resultCountdown{display:flex;align-items:center;gap:7px;color:#b8d0d5;font-size:8px}.pulseDot{width:7px;height:7px;border-radius:50%;background:#31e6a8;box-shadow:0 0 11px #31e6a8;animation:pulse 1.2s infinite}.status-due .pulseDot{background:#ff546c;box-shadow:0 0 11px #ff546c}.resultPrizes{grid-template-columns:repeat(3,1fr)}.resultPrizes b{margin-top:3px;color:#fff;font-size:13px}.resultCardLinks{display:flex;flex-wrap:wrap;gap:6px}.resultCardLinks a{padding:6px 8px;border:1px solid #285761;border-radius:6px;color:#74e7ff;font-size:7px;font-weight:900;text-decoration:none}.resultAdminText{display:grid;gap:5px;margin:0;padding:9px;border-radius:7px;color:#e5f5f7;background:#02090d;font-size:8px;white-space:pre-wrap}.dueButton{box-shadow:0 0 20px rgba(255,68,92,.18)!important}.resultEmpty{grid-column:1/-1;padding:38px;border:1px dashed rgba(0,207,255,.2);border-radius:12px;color:#759098;text-align:center}.resultArchivePanel{overflow:hidden}.resultFilters{display:flex;flex-wrap:wrap;gap:8px;padding:18px}.resultFilters button{min-height:40px;padding:0 13px;border:1px solid #3a5058;border-radius:8px;color:#a4b7bc;background:#0b1920;font-size:8px;font-weight:900}.resultFilters button.active{border-color:#ffe600;color:#111000;background:#ffe600}.resultFilters input,.resultFilters select{min-width:150px}.resultArchiveTable{overflow:auto;border-top:1px solid rgba(0,207,255,.15)}.resultArchiveTable table{width:100%;min-width:980px;border-collapse:collapse}.resultArchiveTable th,.resultArchiveTable td{padding:12px 13px;border-bottom:1px solid rgba(0,207,255,.12);color:#b9d0d5;text-align:left;font-size:8px}.resultArchiveTable th{color:#65e8ff;background:#041217;font-size:7px;letter-spacing:.06em}.resultArchiveTable a{color:#ffe600;font-weight:900}.resultModalBackdrop{position:fixed;z-index:10040;inset:0;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.82);backdrop-filter:blur(8px)}.resultModal{position:relative;display:grid;gap:13px;width:min(620px,95vw);padding:28px;border:1px solid rgba(0,217,255,.35);border-radius:18px;background:linear-gradient(145deg,#071c24,#02090d);box-shadow:0 30px 100px #000}.resultModal>small{color:#ffe600;font-size:8px;font-weight:900;letter-spacing:.15em}.resultModal h2{margin:0;font-size:30px}.resultModal p{margin:0;color:#91aab0;font-size:9px}.resultModal label{display:grid;gap:7px}.resultModal label>span{color:#83a5ad;font-size:8px;font-weight:900}.resultModal textarea{min-height:100px;padding:12px;resize:vertical}.resultModalClose{position:absolute;right:14px;top:13px;width:34px;height:34px;border:1px solid #38515b;border-radius:8px;color:#fff;background:#10232b;font-size:20px}.resultPrizeInputs{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}@keyframes pulse{50%{opacity:.35;transform:scale(.75)}}
          .handoverGrid{display:block!important;max-width:1460px}.handoverStudio{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(390px,.92fr);gap:18px;align-items:start}.handoverEditor,.handoverOutputPanel{overflow:hidden}.handoverBody{padding:24px}.handoverShiftTabs{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}.handoverShiftTabs button{display:flex;align-items:center;justify-content:center;gap:10px;min-height:52px;border:1px solid rgba(0,207,255,.25);border-radius:11px;color:#9eb4ba;background:#071116;font:900 12px "Lexend",Arial,sans-serif}.handoverShiftTabs button small{padding:4px 7px;border-radius:99px;color:#8aa2a8;background:#101e24;font-size:8px}.handoverShiftTabs button.active{border-color:#ffe100;color:#071116;background:linear-gradient(135deg,#fff084,#ffe100);box-shadow:0 10px 28px rgba(255,225,0,.14)}.handoverShiftTabs button.active small{color:#fff;background:#13242b}.handoverComposer{padding:18px;border:1px solid rgba(0,207,255,.2);border-radius:14px;background:rgba(0,8,12,.55)}.handoverComposer label{display:grid;gap:9px}.handoverComposer label>span{color:#62e8ff;font-size:9px;font-weight:900;letter-spacing:.08em}.handoverComposer textarea,.handoverEntry textarea{width:100%;resize:vertical;border:1px solid rgba(0,207,255,.24);border-radius:10px;padding:14px;color:#eafcff;background:#020a0e;font:600 12px/1.65 "Lexend",Arial,sans-serif;outline:none}.handoverComposer textarea:focus,.handoverEntry textarea:focus{border-color:#00d9ff;box-shadow:0 0 0 3px rgba(0,217,255,.08)}.handoverAdd,.handoverCopy{width:100%;min-height:48px;margin-top:12px;font-family:"Lexend",Arial,sans-serif;font-weight:900}.handoverAdd:disabled,.handoverCopy:disabled{opacity:.42;cursor:not-allowed}.handoverEntries{display:grid;gap:12px;margin-top:18px}.handoverEmpty{padding:42px 20px;border:1px dashed rgba(0,207,255,.25);border-radius:12px;color:#77949a;text-align:center;font-size:11px}.handoverEntry{padding:15px;border:1px solid rgba(0,207,255,.21);border-radius:13px;background:linear-gradient(145deg,rgba(7,24,31,.85),rgba(2,9,13,.92))}.handoverEntryTop{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.handoverEntryTop strong{color:#ffe600;font-size:12px;letter-spacing:.08em}.handoverEntryTop div{display:flex;gap:6px}.handoverEntryTop button{min-width:31px;height:29px;border:1px solid rgba(0,207,255,.25);border-radius:7px;color:#bfeef5;background:#0d2027;font:900 10px "Lexend",Arial,sans-serif}.handoverEntryTop button.danger{padding:0 10px;border-color:rgba(255,71,94,.35);color:#ff8b99;background:#2b1016}.handoverEntryTop button:disabled{opacity:.3}.handoverEntry>small{display:block;margin-top:7px;color:#718a90;font-size:8px}.handoverOutputPanel{position:sticky;top:22px}.handoverOutput{min-height:520px;max-height:68vh;overflow:auto;margin:24px 24px 0;border:1px solid rgba(0,207,255,.23);border-radius:13px;background:#02090d}.handoverOutput pre{min-height:520px;margin:0;padding:24px;white-space:pre-wrap;overflow-wrap:anywhere;color:#effcff;font:600 12px/1.75 "Lexend",Arial,sans-serif}.handoverOutputPanel>.handoverCopy,.handoverOutputPanel>.quality{width:calc(100% - 48px);margin-left:24px;margin-right:24px}.handoverClear{padding:10px 14px!important;font-size:9px!important}
          .ssPreviewBackdrop{position:fixed;z-index:9999;inset:0;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.88);backdrop-filter:blur(7px)}
          .ssPreviewModal{display:flex;flex-direction:column;width:min(1180px,96vw);height:min(94vh,980px);overflow:hidden;border:1px solid rgba(238,196,92,.55);border-radius:16px;background:#071019;box-shadow:0 30px 100px #000}
          .ssPreviewHead{display:flex;align-items:center;gap:12px;flex:0 0 auto;padding:12px 15px;border-bottom:1px solid #2f3943;background:#101a25}
          .ssPreviewHead div{display:grid;margin-right:auto}.ssPreviewHead strong{color:#fff;font-size:13px}.ssPreviewHead small{margin-top:3px;color:#8da0ae;font-size:9px}
          .ssPreviewHead a,.ssPreviewHead button{padding:9px 12px;border:1px solid #b9913f;border-radius:8px;color:#ffe38c;background:#242015;font-size:8px;font-weight:900;text-decoration:none}.ssPreviewHead button{width:36px;color:#fff;background:#61202a}
          .ssPreviewImageWrap{flex:1;overflow:auto;padding:0;text-align:center;background:#020609}.ssPreviewImageWrap img{display:block;width:100%;height:auto;margin:0;border-radius:0;background:#fff}
          .shell.lightMode{--ink:#eef9fb;--panel:#ffffff;--line:rgba(0,130,165,.23);--muted:#48666d;color:#102a31!important;color-scheme:light;background:radial-gradient(circle at 82% 0%,rgba(0,196,255,.15),transparent 35%),radial-gradient(circle at 55% 82%,rgba(255,225,0,.13),transparent 32%),repeating-linear-gradient(135deg,rgba(0,135,165,.025) 0 1px,transparent 1px 8px),#edf8fa!important}
          .shell.lightMode::before{opacity:.075!important;mix-blend-mode:multiply}.shell.lightMode::after{opacity:.35;background:radial-gradient(circle at 50% 50%,transparent 42%,rgba(0,143,174,.07) 100%)}
          .shell.lightMode .sidebar{border-color:rgba(0,145,180,.25)!important;background:linear-gradient(180deg,rgba(249,254,255,.99),rgba(225,242,246,.99))!important;box-shadow:16px 0 45px rgba(17,92,108,.12)!important}
          .shell.lightMode .upBrand{background:radial-gradient(circle at 30% 45%,rgba(255,226,0,.2),transparent 40%),radial-gradient(circle at 72% 46%,rgba(0,205,255,.18),transparent 43%),linear-gradient(145deg,#f9ffff,#ddecf0)!important;box-shadow:0 18px 42px rgba(12,77,91,.15),0 0 25px rgba(0,207,255,.1)!important}
          .shell.lightMode .navLabel{color:#47717a}.shell.lightMode .navItem{color:#3f626a!important}.shell.lightMode .navItem small{color:#708c92!important}.shell.lightMode .navItem:hover,.shell.lightMode .navItem.active{color:#092f38!important;background:linear-gradient(90deg,rgba(0,197,239,.15),rgba(255,225,0,.12))!important}
          .shell.lightMode .sub,.shell.lightMode .field span,.shell.lightMode .referenceGuide span,.shell.lightMode .promptTop,.shell.lightMode .quality small{color:#58767d!important}.shell.lightMode .status{color:#31565e!important;background:rgba(255,255,255,.76)!important}
          .shell.lightMode .panel,.shell.lightMode .autoSsToolbar,.shell.lightMode .autoSsCard,.shell.lightMode .validationResult,.shell.lightMode .resultInfoOutput{border-color:rgba(0,146,181,.25)!important;color:#16343b!important;background:linear-gradient(145deg,rgba(255,255,255,.98),rgba(230,244,247,.98))!important;box-shadow:0 22px 55px rgba(20,94,109,.13),inset 0 1px #fff!important}
          .shell.lightMode .panelHead{border-color:rgba(0,146,181,.18)!important}.shell.lightMode .ghost{color:#12363e!important;background:linear-gradient(135deg,#fffbd9,#bff5f2)!important}.shell.lightMode .modeToggle{color:#eaffff!important;background:linear-gradient(135deg,#07586a,#021b24)!important}
          .shell.lightMode .field input,.shell.lightMode .field textarea,.shell.lightMode select,.shell.lightMode .autoSsSearch input,.shell.lightMode .autoSsDate input{border-color:rgba(0,145,180,.24)!important;color:#15343b!important;background:rgba(255,255,255,.9)!important}.shell.lightMode .field input::placeholder,.shell.lightMode .field textarea::placeholder{color:#82999e}
          .shell.lightMode .referenceGuide,.shell.lightMode .syairGuide,.shell.lightMode .usdtIntro,.shell.lightMode .resultInfoIntro,.shell.lightMode .validationIntro,.shell.lightMode .quality,.shell.lightMode .usdtClock{border-color:rgba(0,145,180,.2)!important;background:linear-gradient(135deg,rgba(0,207,255,.08),rgba(255,225,0,.07))!important}
          .shell.lightMode .promptBox,.shell.lightMode .adjustedName,.shell.lightMode .resultMessageBox,.shell.lightMode .usdtOutput,.shell.lightMode .footballCode{border-color:rgba(0,145,180,.2)!important;background:#f7fcfd!important}.shell.lightMode .promptBox p,.shell.lightMode .resultMessageBox p,.shell.lightMode .usdtOutput pre,.shell.lightMode .footballCode textarea{color:#29474e!important;background:transparent!important}
          .shell.lightMode .secondary,.shell.lightMode .historyGrid button,.shell.lightMode .resultStats div{border-color:rgba(0,145,180,.22)!important;color:#315860!important;background:rgba(255,255,255,.68)!important}.shell.lightMode .userBar{border-color:rgba(0,145,180,.25)!important;background:rgba(244,252,253,.96)!important}.shell.lightMode .userBar span{color:#315860!important}
          .shell.lightMode .handoverComposer,.shell.lightMode .handoverEntry,.shell.lightMode .handoverOutput{border-color:rgba(0,145,180,.24)!important;background:#f7fcfd!important}.shell.lightMode .handoverComposer textarea,.shell.lightMode .handoverEntry textarea{color:#17383f!important;background:#fff!important}.shell.lightMode .handoverOutput pre{color:#17383f!important}.shell.lightMode .handoverEmpty{color:#58777e}
          .resultResetAll{min-height:42px;padding:0 15px;border:1px solid #a63b4b;border-radius:9px;color:#ffd1d7;background:linear-gradient(135deg,#43141c,#240b10);font:900 9px "Lexend",Arial,sans-serif}.resultResetAll:hover{border-color:#ff6075;box-shadow:0 0 20px rgba(255,70,95,.18)}.resultArchiveStudio{display:grid;gap:18px}.resultArchiveSummary{display:grid;grid-template-columns:repeat(3,minmax(140px,220px));gap:10px;padding:0 18px 18px}.resultArchiveSummary>span{display:grid;gap:5px;padding:14px 16px;border:1px solid rgba(0,207,255,.2);border-radius:10px;background:#06171d}.resultArchiveSummary small{color:#7e9ba2;font-size:8px;font-weight:900}.resultArchiveSummary b{color:#fff;font-size:18px}.resultArchiveHero{margin-bottom:0}
          .resultReadyCopy{display:grid;gap:8px;padding:12px;border:1px solid rgba(87,242,192,.3);border-radius:10px;background:#020b0e}.resultReadyCopy>small{color:#57f2c0;font-size:8px;font-weight:900;letter-spacing:.08em}.resultReadyCopy pre{max-height:145px;margin:0;overflow:auto;color:#eaffff;font:700 9px/1.55 "Lexend",Arial,sans-serif;white-space:pre-wrap}.resultReadyCopy button{min-height:38px;border:1px solid #42eab4;border-radius:7px;color:#001811;background:#57f2c0;font:900 9px "Lexend",Arial,sans-serif}.resultShioPanel{overflow:hidden}.resultShioToolbar{display:flex;align-items:end;gap:18px;padding:18px 20px}.resultShioToolbar label{display:grid;gap:7px}.resultShioToolbar span{color:#80a1a8;font-size:8px;font-weight:900}.resultShioToolbar input{width:150px;min-height:42px;padding:0 11px;border:1px solid rgba(0,207,255,.25);border-radius:8px;color:#fff;background:#020b0f;font:800 11px "Lexend",Arial,sans-serif}.resultShioToolbar p{margin:0 0 10px;color:#8faab0;font-size:9px}.resultShioGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:0 20px 20px}.resultShioGrid label{display:grid;grid-template-columns:130px 1fr;gap:8px}.resultShioGrid input{min-width:0;min-height:42px;padding:0 11px;border:1px solid rgba(0,207,255,.2);border-radius:8px;color:#dffaff;background:#031116;font:700 9px "Lexend",Arial,sans-serif}.resultShioGrid .shioName{color:#ffe600;font-weight:900}.resultShioGrid input:disabled{opacity:.82}.resultShioSave{margin:0 20px 20px;min-height:44px}.shell.lightMode .resultReadyCopy,.shell.lightMode .resultShioGrid input,.shell.lightMode .resultShioToolbar input{color:#17383f!important;background:#fff!important}.shell.lightMode .resultReadyCopy pre{color:#17383f!important}
          .resultMarketCard{gap:15px;padding:20px}.resultMarketCardTop small{font-size:9px}.resultMarketCardTop h3{font-size:20px;line-height:1.25}.resultMarketCardTop>span{padding:7px 9px;font-size:9px;line-height:1.35}.resultSchedule>div,.resultPrizes>span{padding:12px}.resultSchedule small,.resultPrizes small,.resultAdminText small{font-size:8px;letter-spacing:.04em}.resultSchedule b{font-size:14px}.resultCountdown{font-size:10px}.resultPrizes b{font-size:20px}.resultCardLinks{gap:8px}.resultCardLinks a{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:8px 11px;font-size:9px}.resultAdminText{gap:8px;padding:12px;font-size:10px;line-height:1.55}.resultAdminText a{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:8px 11px;border:1px solid #28b9d5;border-radius:7px;color:#70e9ff;background:#061a21;font-size:10px;font-weight:900;text-decoration:none}.resultAdminText a:hover{border-color:#ffe600;color:#ffe600}.resultAdminText p{margin:0;color:#e5f5f7;font-size:10px;line-height:1.6}.resultMarketCard>button{min-height:44px;font-size:10px;font-weight:900}.resultArchiveTable th,.resultArchiveTable td{font-size:10px}.resultArchiveTable th{font-size:9px}.resultArchiveTable a{display:inline-flex;padding:6px 8px;border:1px solid rgba(0,207,255,.25);border-radius:6px;text-decoration:none}
          .resultMarketCard{position:relative;overflow:hidden;border-width:2px}.resultMarketCard::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:#1ec8ef}.resultMarketCard.status-done{border-color:#28e7a7;background:linear-gradient(145deg,#08251f,#020d0b);box-shadow:0 0 25px rgba(40,231,167,.12)}.resultMarketCard.status-done::before{background:#31eca9;box-shadow:0 0 16px #31eca9}.resultMarketCard.status-open{border-color:#177ca0;background:linear-gradient(145deg,#071f2a,#020c11)}.resultMarketCard.status-open::before{background:#28c9f5}.resultMarketCard.status-waiting{border-color:#d79c22;background:linear-gradient(145deg,#2a2108,#100c02)}.resultMarketCard.status-waiting::before{background:#ffd84a;box-shadow:0 0 15px #ffd84a}.resultMarketCard.status-due{border-color:#ff5068;background:linear-gradient(145deg,#321018,#120408);animation:resultDueGlow 1.8s ease-in-out infinite}.resultMarketCard.status-due::before{background:#ff536b;box-shadow:0 0 18px #ff536b}.status-open .resultMarketCardTop>span{color:#7eeaff;background:#0c3542}.status-waiting .resultMarketCardTop>span{color:#ffe681;background:#4a3509}.status-due .resultMarketCardTop>span{color:#fff;background:#a91f37}.resultMarketCardTop>span{max-width:58%;font-size:10px}.resultSchedule small{font-size:9px}.resultSchedule b{font-size:17px}.resultCountdown{min-height:34px;padding:8px 10px;border-radius:8px;font-size:11px;font-weight:900}.status-done .resultCountdown{color:#67f0bf;background:rgba(27,158,113,.12)}.status-open .resultCountdown{color:#8cecff;background:rgba(19,150,187,.11)}.status-waiting .resultCountdown{color:#ffe681;background:rgba(213,157,32,.13)}.status-due .resultCountdown{color:#ff9dab;background:rgba(222,49,76,.16)}.resultBreakNote{display:flex;align-items:flex-start;gap:10px;padding:12px;border:1px solid rgba(255,216,74,.35);border-radius:10px;color:#ffe681;background:linear-gradient(135deg,rgba(107,75,8,.32),rgba(34,23,2,.62));box-shadow:inset 0 0 18px rgba(255,208,50,.05)}.resultBreakNote>span{font-size:21px}.resultBreakNote>div{display:grid;gap:4px}.resultBreakNote b{font-size:10px;letter-spacing:.08em}.resultBreakNote p{margin:0;color:#f7e7a6;font-size:10px;line-height:1.45}@keyframes resultDueGlow{50%{box-shadow:0 0 32px rgba(255,65,91,.28)}}
          .resultBreakNote.urgent{border-color:rgba(255,83,107,.65);color:#fff;background:linear-gradient(135deg,rgba(154,22,44,.72),rgba(61,7,16,.88));box-shadow:0 0 24px rgba(255,67,94,.18);animation:urgentNotePulse 1.4s ease-in-out infinite}.resultBreakNote.urgent b{color:#fff}.resultBreakNote.urgent p{color:#ffdce2;font-size:11px;font-weight:900}@keyframes urgentNotePulse{50%{border-color:#ff8999;box-shadow:0 0 30px rgba(255,67,94,.32)}}
          .shell.lightMode .resultMarketCard,.shell.lightMode .resultLiveClock,.shell.lightMode .resultMarketForm input,.shell.lightMode .resultMarketForm select,.shell.lightMode .resultFilters input,.shell.lightMode .resultFilters select{color:#17383f!important;background:#f7fcfd!important}.shell.lightMode .resultMarketCardTop h3,.shell.lightMode .resultMarketList b{color:#17383f!important}.shell.lightMode .resultSchedule>div,.shell.lightMode .resultPrizes>span,.shell.lightMode .resultAdminText{background:#fff!important}.shell.lightMode .resultAdminText p{color:#17383f!important}.shell.lightMode .resultAdminText a{color:#087c96;background:#e7faff}.shell.lightMode .resultModal{background:#edf9fb!important}.shell.lightMode .resultModal input,.shell.lightMode .resultModal textarea{color:#17383f!important;background:#fff!important}
          .shell.lightMode .resultBreakNote{background:#fff9dd!important}.shell.lightMode .resultBreakNote p{color:#755600!important}
          /* COMFORT THEME — warna lebih tenang untuk pemakaian lama */
          .shell{--emerald:#55b9c5;--gold:#d8ba58;--lime:#69c9a9;--line:rgba(103,177,188,.2);--muted:#91a7ad;color:#dce8e9!important;background:radial-gradient(circle at 82% 0,rgba(28,111,128,.13),transparent 38%),radial-gradient(circle at 55% 82%,rgba(139,118,47,.06),transparent 34%),#071216!important}
          .shell::before{opacity:.09!important;filter:blur(75px) saturate(.58)!important}.shell::after{opacity:.22!important}.shell .sidebar{border-color:rgba(92,161,172,.2)!important;background:linear-gradient(180deg,#09171c,#061014)!important;box-shadow:12px 0 38px rgba(0,0,0,.3)!important}.shell .panel,.shell .autoSsToolbar,.shell .autoSsCard{border-color:rgba(98,167,177,.2)!important;background:linear-gradient(145deg,#102127,#0a171c)!important;box-shadow:0 16px 38px rgba(0,0,0,.24)!important}.shell .navItem:hover,.shell .navItem.active{border-color:rgba(91,174,185,.32)!important;background:linear-gradient(90deg,rgba(61,139,151,.16),rgba(163,139,60,.05))!important}.shell .navItem.active i{background:linear-gradient(145deg,#d5bd69,#62bdc6)!important;box-shadow:0 0 12px rgba(83,172,184,.18)!important}.shell .primary,.shell .validateButton{color:#07171b!important;background:linear-gradient(135deg,#73c2cb,#54aab6)!important;box-shadow:0 8px 22px rgba(65,146,158,.14)!important}.shell .generate{color:#171408!important;background:linear-gradient(135deg,#e4d48d,#cbb35a)!important}.shell .field input,.shell .field textarea{border-color:rgba(101,167,177,.2)!important;background:#08151a!important}.shell .field input:focus,.shell .field textarea:focus{border-color:rgba(104,188,199,.5)!important;box-shadow:0 0 0 3px rgba(91,170,181,.07)!important}.shell h1,.shell h2,.shell h3,.shell .navItem b{text-shadow:none!important}.status,.modeToggle,.rgbButton{box-shadow:none!important}
          .footballControls{border-color:rgba(103,169,180,.22)!important;background:#0c1b20!important}.footballSource a{color:#d5bd69!important}.footballThemePicker button{border-color:#43545a!important;color:#b7c7ca!important;background:#18262b!important;box-shadow:none!important}.footballThemePicker button.selected{border-color:#7c8f94!important;color:#eef5f5!important;background:#32434a!important}.footballThemePicker button.selected.blue{border-color:#67aeb9!important;color:#eaf7f8!important;background:#356d78!important;box-shadow:0 5px 16px rgba(55,125,137,.14)!important}.footballActions button{border-color:#4d6066!important;color:#d5e0e2!important;background:#223138!important;box-shadow:none!important}.footballActions .copyWp{border-color:#b49a4f!important;color:#171408!important;background:#d4bd6c!important}.footballStats b{border-color:rgba(102,169,180,.25)!important;color:#d8c273!important;background:#102128!important}.footballBoard.footballWpPreview{border-color:#4d9099!important;box-shadow:0 20px 48px rgba(0,0,0,.24)!important}.footballBoard.footballWpPreview.blue{color:#dbe9eb!important;background:linear-gradient(180deg,#10272e,#0b1d23)!important}.footballWpPreview.blue .footballNotice{border-color:#527e86!important;color:#c9d9dc!important;background:#172d34!important}.footballWpPreview.blue .footballLeague{border-color:rgba(97,161,171,.26)!important;background:#0e2127!important}.footballWpPreview.blue .footballLeague h2{color:#d7c575!important;border-color:rgba(104,170,180,.25)!important}.footballWpPreview.blue .footballMatchCard{border-color:rgba(98,158,168,.24)!important;color:#dce9ea!important;background:#13262c!important}.footballWpPreview.blue .footballPrediction{border-color:#5fa5af!important;color:#e9f4f5!important;background:#254b54!important;box-shadow:none!important}.footballWpPreview.blue .footballPrediction strong{color:#f1dc80!important}.footballWpPreview.blue h1{color:#e3d17c!important;-webkit-text-fill-color:#e3d17c!important;background:none!important;animation:none!important;text-shadow:none!important}
          .shell.lightMode{--ink:#263e43;--panel:#f8faf9;--line:rgba(75,132,142,.2);--muted:#61777c;color:#263e43!important;background:radial-gradient(circle at 82% 0,rgba(94,160,169,.09),transparent 38%),radial-gradient(circle at 55% 82%,rgba(181,155,74,.06),transparent 34%),#e9efee!important}.shell.lightMode::before{opacity:.045!important;filter:blur(90px) saturate(.45)!important}.shell.lightMode::after{opacity:.12!important}.shell.lightMode .sidebar{border-color:rgba(81,135,144,.19)!important;background:linear-gradient(180deg,#f4f7f6,#e7edec)!important;box-shadow:12px 0 32px rgba(39,75,82,.08)!important}.shell.lightMode .panel,.shell.lightMode .autoSsToolbar,.shell.lightMode .autoSsCard,.shell.lightMode .validationResult,.shell.lightMode .resultInfoOutput{border-color:rgba(75,132,142,.2)!important;color:#263e43!important;background:linear-gradient(145deg,#fafcfb,#f0f4f3)!important;box-shadow:0 14px 34px rgba(47,82,88,.08)!important}.shell.lightMode .upBrand{background:linear-gradient(145deg,#f4f7f6,#e4ebea)!important;box-shadow:0 14px 32px rgba(40,78,85,.09)!important}.shell.lightMode .navItem:hover,.shell.lightMode .navItem.active{color:#243e43!important;background:linear-gradient(90deg,rgba(82,154,165,.12),rgba(182,156,77,.06))!important}.shell.lightMode .ghost{color:#304b50!important;background:#e4eceb!important}.shell.lightMode .modeToggle{color:#edf5f5!important;background:#344d53!important}.shell.lightMode .field input,.shell.lightMode .field textarea,.shell.lightMode select,.shell.lightMode .autoSsSearch input,.shell.lightMode .autoSsDate input{border-color:rgba(76,132,142,.22)!important;color:#29454a!important;background:#f8faf9!important}.shell.lightMode .referenceGuide,.shell.lightMode .syairGuide,.shell.lightMode .usdtIntro,.shell.lightMode .resultInfoIntro,.shell.lightMode .validationIntro,.shell.lightMode .quality,.shell.lightMode .usdtClock{border-color:rgba(78,135,144,.18)!important;background:#edf3f2!important}.shell.lightMode .footballControls{background:#f3f6f5!important}.shell.lightMode .footballThemePicker button{color:#536a6f!important;background:#e5ebea!important}.shell.lightMode .footballThemePicker button.selected.blue{color:#f5fbfb!important;background:#527f87!important}.shell.lightMode .footballActions button{color:#40585d!important;background:#e2e8e7!important}.shell.lightMode .footballActions .copyWp{color:#332d18!important;background:#d8c57c!important}.shell.lightMode .footballBoard.footballWpPreview.blue{border-color:#80aeb5!important;color:#29464b!important;background:linear-gradient(180deg,#e8f0ef,#dfe9e8)!important;box-shadow:0 16px 36px rgba(42,78,84,.1)!important}.shell.lightMode .footballWpPreview.blue .footballNotice{border-color:#9ab8bc!important;color:#496267!important;background:#f1f5f4!important}.shell.lightMode .footballWpPreview.blue .footballLeague{border-color:#adc3c6!important;background:#edf2f1!important}.shell.lightMode .footballWpPreview.blue .footballLeague h2{color:#6d6135!important}.shell.lightMode .footballWpPreview.blue .footballMatchCard{border-color:#afc5c8!important;color:#29464b!important;background:#f8faf9!important}.shell.lightMode .footballWpPreview.blue .footballPrediction{border-color:#7eaab0!important;color:#f4f9f9!important;background:#527d85!important}.shell.lightMode .footballWpPreview.blue .footballPrediction strong{color:#fff0ad!important}.shell.lightMode .footballWpPreview.blue h1{color:#5b704d!important;-webkit-text-fill-color:#5b704d!important}
          .shell.darkMode{color-scheme:dark}
          @media(max-width:1200px){.resultMarketCards{grid-template-columns:repeat(2,minmax(0,1fr))}.resultMarketForm{grid-template-columns:repeat(3,1fr)}}
          @media(max-width:1050px){.handoverStudio{grid-template-columns:1fr}.handoverOutputPanel{position:static}.handoverOutput{min-height:400px}.handoverOutput pre{min-height:400px}.resultTrackerHero{align-items:flex-start;flex-wrap:wrap}}
          @media(max-width:620px){.ssPreviewBackdrop{padding:7px}.ssPreviewModal{width:100%;height:96vh}.ssPreviewHead{flex-wrap:wrap}.ssPreviewHead div{width:100%}.ssThumbnailButton img{height:150px}.handoverBody{padding:14px}.handoverShiftTabs{grid-template-columns:1fr}.handoverOutput{margin:14px 14px 0}.handoverOutputPanel>.handoverCopy,.handoverOutputPanel>.quality{width:calc(100% - 28px);margin-left:14px;margin-right:14px}.resultTrackerHero{padding:18px}.resultLiveClock{width:100%}.resultMarketCards,.resultMarketForm,.resultPrizeInputs{grid-template-columns:1fr}.resultMarketList>div{grid-template-columns:1fr 1fr}.resultMarketList small{grid-column:1/-1}}
        `}</style>
      </main>
    </AuthGate>
  );
}
