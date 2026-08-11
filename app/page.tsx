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
  | "monitor";
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
    "Kabut tipis turun perlahan\nSuara angin membawa pesan\nPilih angka penuh keyakinan\nSemoga hasil jadi harapan",
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
  const [monitorAuto] = useState(true);
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
  const [monitorExtensionProgress, setMonitorExtensionProgress] = useState("");
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
    const saved = localStorage.getItem("prompt-history");
    if (saved) setHistory(JSON.parse(saved));
    const savedThemeVersion = localStorage.getItem("premankaro-theme-version");
    const savedRgb =
      savedThemeVersion === "up-cyan-v1"
        ? localStorage.getItem("premankaro-rgb")
        : null;
    const savedMode = localStorage.getItem("premankaro-display-mode");
    const savedMonitor = localStorage.getItem("premankaro-link-monitor");
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
    setRgbLoaded(true);
    setMonitorLoaded(true);
  }, []);

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
      if (monitorExtensionReady) {
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
        if (failures.length) setMonitorError(failures.join(" | "));
        return;
      }
      const response = await fetch("/api/site-monitor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "run",
          shift: selectedShift,
          categoryId: category?.id,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Screenshot situs gagal.");
      await loadMonitor(selectedShift);
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
    monitorCategories,
    monitorResults,
    monitorLastChecked,
  ]);

  useEffect(() => {
    if (!monitorAuto || kind !== "monitor" || !monitorExtensionReady) return;
    const runScheduledShift = () => {
      const nowParts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(new Date());
      const hour = Number(
        nowParts.find((part) => part.type === "hour")?.value || "0",
      );
      const shift: "pagi" | "malam" | null =
        hour >= 21 ? "malam" : hour >= 9 ? "pagi" : null;
      if (!shift) return;
      const key = `premankaro-auto-ss-${new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })}-${shift}`;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, new Date().toISOString());
      setMonitorShift(shift);
      checkLinks(undefined, shift).catch(() => localStorage.removeItem(key));
    };
    runScheduledShift();
    const timer = window.setInterval(runScheduledShift, 30_000);
    return () => window.clearInterval(timer);
  }, [
    monitorAuto,
    kind,
    monitorExtensionReady,
    monitorCategories,
    monitorChecking,
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
    localStorage.setItem("premankaro-display-mode", displayMode);
  }, [displayMode]);

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
        shio: pickDifferent(shioBank, old.shio),
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
            <span className="upAura upAuraOne" />
            <span className="upAura upAuraTwo" />
            <img
              className="brandLogo upLogo"
              src="/logo-up-premium-transparent.png"
              alt="Logo UP Premium 3D Bergerak"
            />
          </div>
          <div className="sidebarMenuScroll">
            <p className="navLabel">PROMPT POSTINGAN</p>
            <nav>
              {kinds.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  className={kind === item.id ? "navItem active" : "navItem"}
                  onClick={() => setKind(item.id)}
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
              {kinds.slice(4).map((item) => (
                <button
                  key={item.id}
                  className={kind === item.id ? "navItem active" : "navItem"}
                  onClick={() => setKind(item.id)}
                >
                  <i>{item.icon}</i>
                  <span>
                    <b>{item.label}</b>
                    <small>{item.hint}</small>
                  </span>
                </button>
              ))}
            </nav>
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
                  : "Isi detail konten, lalu salin prompt siap pakai ke generator gambar pilihan Anda."}
              </p>
            </div>
            <div className="headerTools">
              <div className="status">
                <span /> ONLINE
              </div>
              <button
                className="modeToggle"
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
                : kind === "bola"
                  ? "grid footballGrid lexendContent"
                  : kind === "validasi"
                    ? "grid validationGrid lexendContent"
                    : kind === "usdt" || kind === "result"
                      ? "grid usdtGrid lexendContent"
                      : "grid lexendContent"
            }
          >
            {kind === "monitor" ? (
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
                      : "○ EXTENSION BELUM AKTIF · BROWSER RUN SEBAGAI CADANGAN"}
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
                    <label>✓ CEK OTOMATIS</label>
                    <span>SHIFT PAGI</span>
                    <strong>09:00 WIB</strong>
                    <span>SHIFT MALAM</span>
                    <strong>21:00 WIB</strong>
                    <b>CRON OTOMATIS AKTIF</b>
                  </div>
                </section>
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
                            label="Isi Syair"
                            value={form.isiSyair}
                            onChange={update("isiSyair")}
                            area
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
          .upLogo{position:absolute!important;z-index:4;left:50%;top:50%;display:block;width:84%!important;height:84%!important;max-width:214px!important;max-height:214px!important;margin:0!important;object-fit:contain!important;object-position:center center!important;transform-origin:center center;transform-style:preserve-3d;backface-visibility:visible;animation:upLogoFullRotate 8s linear infinite!important;filter:contrast(1.08) saturate(1.2) drop-shadow(0 14px 18px rgba(0,0,0,.65)) drop-shadow(0 0 10px rgba(0,217,255,.3)) drop-shadow(0 0 16px rgba(255,230,0,.16))!important;will-change:transform,filter}
          .upAura{position:absolute;z-index:1;left:50%;top:50%;border-radius:50%;pointer-events:none;mix-blend-mode:screen}.upAuraOne{width:80%;height:62%;border:1px solid rgba(0,217,255,.38);box-shadow:0 0 18px rgba(0,217,255,.28),inset 0 0 22px rgba(255,230,0,.1);transform:translate(-50%,-50%) rotateX(70deg);animation:upAuraSpin 7s linear infinite}.upAuraTwo{width:64%;height:78%;background:conic-gradient(from 0deg,transparent,#ffe60066,transparent,#00d9ff70,transparent,#00ffa850,transparent);filter:blur(14px);opacity:.42;transform:translate(-50%,-50%);animation:upAuraSpinFlat 10s linear infinite reverse}
          @keyframes upLogoFullRotate{0%{transform:translate(-50%,-50%) perspective(1000px) rotateY(0deg) scale(.96);filter:contrast(1.1) saturate(1.25) brightness(1.04) drop-shadow(0 0 12px #00d9ff)}25%{transform:translate(-50%,-50%) perspective(1000px) rotateY(90deg) scale(1);filter:contrast(1.14) saturate(1.38) brightness(1.14) drop-shadow(0 0 18px #ffe600)}50%{transform:translate(-50%,-50%) perspective(1000px) rotateY(180deg) scale(.96);filter:contrast(1.1) saturate(1.25) brightness(1.05) drop-shadow(0 0 13px #00ffa8)}75%{transform:translate(-50%,-50%) perspective(1000px) rotateY(270deg) scale(1);filter:contrast(1.14) saturate(1.38) brightness(1.14) drop-shadow(0 0 18px #00d9ff)}100%{transform:translate(-50%,-50%) perspective(1000px) rotateY(360deg) scale(.96);filter:contrast(1.1) saturate(1.25) brightness(1.04) drop-shadow(0 0 12px #ffe600)}}
          @keyframes upAuraSpin{to{transform:translate(-50%,-50%) rotateX(70deg) rotateZ(360deg)}}@keyframes upAuraSpinFlat{to{transform:translate(-50%,-50%) rotate(360deg)}}@keyframes upFrameGlow{50%{border-color:rgba(0,255,168,.34);box-shadow:inset 0 0 42px #000,0 0 26px rgba(0,217,255,.2)}}@keyframes upEnergyLine{to{background-position:240% 0}}
          .autoSsActions .extensionButton{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 20px;border:1px solid #586472;border-radius:10px;color:#d9dee4;background:#242c36;font-size:9px;font-weight:900;text-decoration:none}
          .ssThumbnailButton img{display:block;width:100%;height:115px;object-fit:cover;object-position:top center;background:#05090c}
          .ssThumbnailButton span{position:absolute;right:7px;bottom:7px;padding:5px 8px;border-radius:5px;color:#ffe394;background:rgba(5,8,10,.88);font-size:7px;font-weight:900;letter-spacing:.04em;box-shadow:0 3px 12px #000}
          .autoSsCardFoot{gap:6px}.autoSsCardFoot small{margin-right:auto}.autoSsCardFoot .viewSsButton{color:#dfffee;border-color:#42b98a;background:#103d30}
          .ssPreviewBackdrop{position:fixed;z-index:9999;inset:0;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.88);backdrop-filter:blur(7px)}
          .ssPreviewModal{display:flex;flex-direction:column;width:min(1180px,96vw);height:min(94vh,980px);overflow:hidden;border:1px solid rgba(238,196,92,.55);border-radius:16px;background:#071019;box-shadow:0 30px 100px #000}
          .ssPreviewHead{display:flex;align-items:center;gap:12px;flex:0 0 auto;padding:12px 15px;border-bottom:1px solid #2f3943;background:#101a25}
          .ssPreviewHead div{display:grid;margin-right:auto}.ssPreviewHead strong{color:#fff;font-size:13px}.ssPreviewHead small{margin-top:3px;color:#8da0ae;font-size:9px}
          .ssPreviewHead a,.ssPreviewHead button{padding:9px 12px;border:1px solid #b9913f;border-radius:8px;color:#ffe38c;background:#242015;font-size:8px;font-weight:900;text-decoration:none}.ssPreviewHead button{width:36px;color:#fff;background:#61202a}
          .ssPreviewImageWrap{flex:1;overflow:auto;padding:12px;text-align:center;background:#020609}.ssPreviewImageWrap img{display:block;width:min(100%,1280px);height:auto;margin:auto;border-radius:8px;background:#fff}
          @media(max-width:620px){.ssPreviewBackdrop{padding:7px}.ssPreviewModal{width:100%;height:96vh}.ssPreviewHead{flex-wrap:wrap}.ssPreviewHead div{width:100%}.ssThumbnailButton img{height:150px}}
        `}</style>
      </main>
    </AuthGate>
  );
}
