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

async function checkOne(input: string): Promise<CheckResult> {
  const checkedAt = new Date().toISOString();
  let normalized: URL;
  try { normalized = normalizeUrl(input); }
  catch (error) {
    return { url: input, hostname: input, status: "problem", httpStatus: null, latency: 0, finalUrl: "", checkedAt, message: error instanceof Error ? error.message : "Link tidak valid.", nawala: "unknown" };
  }
  const started = Date.now();
  try {
    const response = await fetch(normalized.toString(), {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      headers: { "user-agent": "PremanKaro-LinkMonitor/1.0", accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
      cf: { cacheTtl: 0, cacheEverything: false },
    } as RequestInit & { cf: unknown });
    const latency = Date.now() - started;
    const safe = response.status >= 200 && response.status < 400;
    try { await response.body?.cancel(); } catch {}
    return {
      url: normalized.toString(), hostname: normalized.hostname, status: safe ? "safe" : "problem", httpStatus: response.status,
      latency, finalUrl: response.url || normalized.toString(), checkedAt,
      message: safe ? `Halaman berhasil diakses${response.redirected ? " dan mengalami redirect" : ""}.` : `Server merespons HTTP ${response.status}.`,
      nawala: "unknown",
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
    return json({ results, checkedAt: new Date().toISOString(), trustPositif: { connected: false, message: "API resmi TrustPositif belum tersedia." } });
  } catch {
    return json({ error: "Permintaan pengecekan tidak dapat diproses." }, 400);
  }
}
