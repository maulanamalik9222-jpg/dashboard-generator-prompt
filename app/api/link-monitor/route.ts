type CheckResult = {
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

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "cache-control": "no-store" } });

function normalizeUrl(value: string) {
  const raw = value.trim();
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Protokol tidak didukung");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host === "0.0.0.0" || host === "127.0.0.1" || host === "::1" || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) throw new Error("Alamat lokal tidak boleh diperiksa");
  url.hash = "";
  return url;
}

async function checkNawala(domain: string): Promise<"safe" | "blocked" | "unknown"> {
  try {
    const body = new URLSearchParams({ name: domain, csrf_token: "585d47f172810956ccfa9a10a84e355e" });
    const response = await fetch("https://trustpositif.komdigi.go.id/Rest_server/getrecordsname_home", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(15_000),
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        accept: "application/json, text/plain, */*",
        origin: "https://trustpositif.komdigi.go.id",
        referer: `https://trustpositif.komdigi.go.id/welcome?domains=${encodeURIComponent(domain)}`,
        "x-requested-with": "XMLHttpRequest",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
      },
      cf: { cacheTtl: 0, cacheEverything: false },
    } as RequestInit & { cf: unknown });
    if (!response.ok) return "unknown";
    const data = await response.json() as { values?: Array<{ Status?: string }> };
    const values = Array.isArray(data.values) ? data.values : [];
    return values.some((item) => String(item.Status || "").toLowerCase() === "ada") ? "blocked" : "safe";
  } catch { return "unknown"; }
}

async function checkOne(input: string): Promise<CheckResult> {
  const checkedAt = new Date().toISOString();
  let normalized: URL;
  try { normalized = normalizeUrl(input); }
  catch (error) {
    return { url: input, hostname: input, status: "problem", httpStatus: null, latency: 0, finalUrl: "", checkedAt, message: error instanceof Error ? error.message : "Link tidak valid.", nawala: "unknown" };
  }
  const started = Date.now();
  try {
    const [response, nawala] = await Promise.all([fetch(normalized.toString(), {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      headers: { "user-agent": "PremanKaro-LinkMonitor/1.0", accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
      cf: { cacheTtl: 0, cacheEverything: false },
    } as RequestInit & { cf: unknown }), checkNawala(normalized.hostname)]);
    const latency = Date.now() - started;
    const safe = response.status >= 200 && response.status < 400;
    try { await response.body?.cancel(); } catch {}
    return {
      url: normalized.toString(), hostname: normalized.hostname, status: safe ? "safe" : "problem", httpStatus: response.status,
      latency, finalUrl: response.url || normalized.toString(), checkedAt,
      message: safe ? `Halaman berhasil diakses${response.redirected ? " dan mengalami redirect" : ""}.` : `Server merespons HTTP ${response.status}.`,
      nawala,
    };
  } catch (error) {
    return {
      url: normalized.toString(), hostname: normalized.hostname, status: "problem", httpStatus: null, latency: Date.now() - started,
      finalUrl: normalized.toString(), checkedAt,
      message: error instanceof Error && error.name === "TimeoutError" ? "Waktu pemeriksaan habis setelah 12 detik." : "Link tidak dapat dibuka dari server Cloudflare.",
      nawala: "unknown",
    };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { urls?: unknown };
    if (!Array.isArray(body.urls)) return json({ error: "Daftar link tidak valid." }, 400);
    const urls = Array.from(new Set(body.urls.map(String).map((value) => value.trim()).filter(Boolean))).slice(0, 50);
    if (!urls.length) return json({ error: "Masukkan minimal satu link." }, 400);
    const results: CheckResult[] = [];
    for (let index = 0; index < urls.length; index += 8) results.push(...await Promise.all(urls.slice(index, index + 8).map(checkOne)));
    return json({ results, checkedAt: new Date().toISOString(), trustPositif: { connected: results.some((item) => item.nawala !== "unknown"), source: "https://trustpositif.komdigi.go.id/" } });
  } catch {
    return json({ error: "Permintaan pengecekan tidak dapat diproses." }, 400);
  }
}
