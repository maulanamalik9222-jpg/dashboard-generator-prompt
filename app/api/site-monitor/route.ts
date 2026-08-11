import puppeteer from "@cloudflare/puppeteer";
import { env } from "cloudflare:workers";
import { currentUser } from "../../lib/auth";

type RuntimeEnv = {
  DB: D1Database;
  BROWSER: Fetcher;
  SITE_CREDENTIAL_KEY?: string;
  MONITOR_BYPASS_TOKEN?: string;
};

type CategoryInput = {
  id?: string;
  name?: string;
  url?: string;
  login?: boolean;
  active?: boolean;
};

const runtime = () => env as unknown as RuntimeEnv;
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "cache-control": "no-store" } });
const delay = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

/**
 * Nilai BLOB D1 dapat dikembalikan sebagai ArrayBuffer, typed-array, atau
 * array angka (tergantung versi runtime). Response() tidak boleh menerima
 * array angka secara langsung karena hasilnya berubah menjadi teks dan JPEG
 * menjadi rusak. Selalu normalkan kembali menjadi Uint8Array.
 */
function blobToBytes(value: unknown): Uint8Array {
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  if (Array.isArray(value)) return Uint8Array.from(value.map(Number));
  if (value && typeof value === "object" && "data" in value) {
    const data = (value as { data?: unknown }).data;
    if (Array.isArray(data)) return Uint8Array.from(data.map(Number));
  }
  throw new Error("Format BLOB screenshot dari D1 tidak dikenali.");
}

function wibDay(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function normalizeUrl(value: string) {
  const raw = value.trim();
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  if (!/^https?:$/.test(url.protocol))
    throw new Error("Protokol link tidak didukung.");
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".local") ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  )
    throw new Error("Alamat lokal tidak dapat diperiksa.");
  url.hash = "";
  return url.toString();
}

async function ensureSchema() {
  const db = runtime().DB;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS monitor_categories (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT NOT NULL,
      needs_login INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS monitor_credentials (
      id TEXT PRIMARY KEY CHECK (id='default'), encrypted_value TEXT NOT NULL, updated_at INTEGER NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS monitor_screenshots (
      id TEXT PRIMARY KEY, category_id TEXT NOT NULL, day TEXT NOT NULL,
      shift TEXT NOT NULL, image BLOB NOT NULL, mime TEXT NOT NULL,
      status TEXT NOT NULL, http_status INTEGER, final_url TEXT,
      message TEXT, checked_at INTEGER NOT NULL,
      UNIQUE(category_id, day, shift)
    )`),
    db.prepare(
      "CREATE INDEX IF NOT EXISTS idx_monitor_shots_day_shift ON monitor_screenshots(day, shift)",
    ),
  ]);
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function encryptionKey() {
  const secret = runtime().SITE_CREDENTIAL_KEY;
  if (!secret || secret.length < 24) {
    throw new Error("Secret SITE_CREDENTIAL_KEY belum dipasang di Cloudflare.");
  }
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret),
  );
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

async function encryptCredentials(username: string, password: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(
    JSON.stringify({ username, password }),
  );
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await encryptionKey(),
    plain,
  );
  return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`;
}

async function decryptCredentials(value: string) {
  const [ivText, dataText] = value.split(".");
  if (!ivText || !dataText) throw new Error("Data login tidak valid.");
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(ivText) },
    await encryptionKey(),
    base64ToBytes(dataText),
  );
  return JSON.parse(new TextDecoder().decode(plain)) as {
    username: string;
    password: string;
  };
}

async function savedCredentials() {
  const row = await runtime()
    .DB.prepare(
      "SELECT encrypted_value FROM monitor_credentials WHERE id='default'",
    )
    .first<{ encrypted_value: string }>();
  return row ? decryptCredentials(row.encrypted_value) : null;
}

async function attemptGenericLogin(
  page: any,
  credentials: { username: string; password: string },
) {
  const passwordSelector = 'input[type="password"]';
  const passwordField = await page.$(passwordSelector);
  if (!passwordField)
    return {
      attempted: false,
      message: "Form login tidak ditemukan pada halaman.",
    };

  const usernameSelectors = [
    'input[name*="user" i]',
    'input[name*="login" i]',
    'input[name*="email" i]',
    'input[type="email"]',
    'input[type="text"]',
  ];
  let usernameSelector = "";
  for (const selector of usernameSelectors) {
    if (await page.$(selector)) {
      usernameSelector = selector;
      break;
    }
  }
  if (!usernameSelector)
    return { attempted: false, message: "Kolom username tidak ditemukan." };

  await page.click(usernameSelector, { clickCount: 3 });
  await page.type(usernameSelector, credentials.username, { delay: 25 });
  await page.click(passwordSelector, { clickCount: 3 });
  await page.type(passwordSelector, credentials.password, { delay: 25 });
  const submitSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button[name*="login" i]',
    ".login-button",
    "#login",
  ];
  let submitted = false;
  for (const selector of submitSelectors) {
    if (await page.$(selector)) {
      await Promise.allSettled([
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15_000 }),
        page.click(selector),
      ]);
      submitted = true;
      break;
    }
  }
  if (!submitted) {
    await page.focus(passwordSelector);
    await page.keyboard.press("Enter");
    await delay(4_000);
  }
  return { attempted: true, message: "Proses login otomatis dijalankan." };
}

async function captureCategory(
  browser: any,
  category: any,
  shift: "pagi" | "malam",
) {
  const db = runtime().DB;
  const day = wibDay();
  const checkedAt = Date.now();
  const id = crypto.randomUUID();
  let page: any;
  try {
    const url = normalizeUrl(String(category.url));
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 820, deviceScaleFactor: 1 });
    // Jalur resmi untuk situs milik sendiri. Domain tujuan harus mempunyai
    // WAF Skip Rule yang memverifikasi nilai header ini. Token hanya berada
    // di Worker dan tidak pernah dikirim ke browser pengguna dashboard.
    const bypassToken = runtime().MONITOR_BYPASS_TOKEN?.trim();
    if (bypassToken) {
      await page.setExtraHTTPHeaders({
        "x-premankaro-monitor": bypassToken,
      });
    }
    const response = await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 25_000,
    });
    let loginMessage = "Tanpa login.";
    if (Number(category.needs_login)) {
      const credentials = await savedCredentials();
      if (!credentials)
        throw new Error(
          "Kategori memerlukan login, tetapi akun login belum disimpan.",
        );
      const loginResult = await attemptGenericLogin(page, credentials);
      loginMessage = loginResult.message;
      if (loginResult.attempted) {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 25_000 });
      }
    }
    await delay(1_500);
    const shot = (await page.screenshot({
      type: "jpeg",
      quality: 48,
      fullPage: true,
    })) as Uint8Array;
    if (shot.byteLength > 1_850_000)
      throw new Error(
        "Screenshot lebih dari 1,85 MB. Halaman terlalu panjang untuk D1.",
      );
    const image = shot.buffer.slice(
      shot.byteOffset,
      shot.byteOffset + shot.byteLength,
    );
    const statusCode = response?.status?.() ?? null;
    const status = statusCode && statusCode >= 400 ? "problem" : "safe";
    await db
      .prepare(
        `INSERT INTO monitor_screenshots
      (id,category_id,day,shift,image,mime,status,http_status,final_url,message,checked_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(category_id,day,shift) DO UPDATE SET
      id=excluded.id,image=excluded.image,mime=excluded.mime,status=excluded.status,
      http_status=excluded.http_status,final_url=excluded.final_url,
      message=excluded.message,checked_at=excluded.checked_at`,
      )
      .bind(
        id,
        category.id,
        day,
        shift,
        image,
        "image/jpeg",
        status,
        statusCode,
        page.url(),
        loginMessage,
        checkedAt,
      )
      .run();
    return {
      id,
      categoryId: category.id,
      status,
      httpStatus: statusCode,
      finalUrl: page.url(),
      message: loginMessage,
      checkedAt,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Pengecekan situs gagal.";
    const blank = new Uint8Array([255, 216, 255, 217]).buffer;
    await db
      .prepare(
        `INSERT INTO monitor_screenshots
      (id,category_id,day,shift,image,mime,status,http_status,final_url,message,checked_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(category_id,day,shift) DO UPDATE SET
      id=excluded.id,image=excluded.image,status='problem',http_status=NULL,
      final_url='',message=excluded.message,checked_at=excluded.checked_at`,
      )
      .bind(
        id,
        category.id,
        day,
        shift,
        blank,
        "image/jpeg",
        "problem",
        null,
        "",
        message,
        checkedAt,
      )
      .run();
    return {
      id,
      categoryId: category.id,
      status: "problem",
      httpStatus: null,
      finalUrl: "",
      message,
      checkedAt,
    };
  } finally {
    if (page) await page.close().catch(() => undefined);
  }
}

async function launchBrowserWithRetry() {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await puppeteer.launch(runtime().BROWSER as any);
    } catch (error) {
      lastError = error;
      if (!String(error).includes("429") || attempt === 2) throw error;
      await delay((attempt + 1) * 5_000);
    }
  }
  throw lastError;
}

async function runChecks(shift: "pagi" | "malam", categoryId?: string) {
  await ensureSchema();
  const db = runtime().DB;
  await db
    .prepare("DELETE FROM monitor_screenshots WHERE day<>?")
    .bind(wibDay())
    .run();
  const query = categoryId
    ? db
        .prepare("SELECT * FROM monitor_categories WHERE active=1 AND id=?")
        .bind(categoryId)
    : db.prepare(
        "SELECT * FROM monitor_categories WHERE active=1 ORDER BY sort_order,name",
      );
  const rows = await query.all<any>();
  const results = [];
  if (!rows.results.length) return results;
  const browser = await launchBrowserWithRetry();
  try {
    for (const category of rows.results)
      results.push(await captureCategory(browser, category, shift));
    return results;
  } finally {
    await browser.close().catch(() => undefined);
  }
}

async function authorized(request: Request) {
  const secret = runtime().SITE_CREDENTIAL_KEY;
  if (secret && request.headers.get("x-monitor-cron") === secret)
    return { internal: true };
  const user = await currentUser(request);
  return user ? { internal: false, user } : null;
}

export async function GET(request: Request) {
  await ensureSchema();
  if (!(await authorized(request)))
    return json({ error: "Silakan login kembali." }, 401);
  const url = new URL(request.url);
  const imageId = url.searchParams.get("image");
  if (imageId) {
    const row = await runtime()
      .DB.prepare(
        "SELECT image,mime FROM monitor_screenshots WHERE id=? AND day=?",
      )
      .bind(imageId, wibDay())
      .first<{ image: unknown; mime: string }>();
    if (!row)
      return new Response("Screenshot tidak ditemukan.", { status: 404 });
    let bytes: Uint8Array;
    try {
      bytes = blobToBytes(row.image);
    } catch (error) {
      return new Response(
        error instanceof Error ? error.message : "Screenshot tidak valid.",
        { status: 500 },
      );
    }
    if (bytes.byteLength < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
      return new Response("Data screenshot JPEG rusak. Silakan SS ulang.", {
        status: 422,
      });
    }
    const responseBody = bytes.slice().buffer as ArrayBuffer;
    return new Response(responseBody, {
      headers: {
        "content-type": row.mime || "image/jpeg",
        "content-length": String(bytes.byteLength),
        "cache-control": "private, no-store",
        "content-disposition": `inline; filename="screenshot-${imageId}.jpg"`,
        "x-content-type-options": "nosniff",
      },
    });
  }
  const shift = url.searchParams.get("shift") === "malam" ? "malam" : "pagi";
  const [categories, results, credential] = await Promise.all([
    runtime()
      .DB.prepare(
        "SELECT id,name,url,needs_login login,active,sort_order FROM monitor_categories ORDER BY sort_order,name",
      )
      .all(),
    runtime()
      .DB.prepare(
        `SELECT id,category_id categoryId,status,http_status httpStatus,
      final_url finalUrl,message,checked_at checkedAt,
      CASE WHEN length(image)>100 THEN 1 ELSE 0 END hasImage
      FROM monitor_screenshots
      WHERE day=? AND shift=? ORDER BY checked_at DESC`,
      )
      .bind(wibDay(), shift)
      .all(),
    runtime()
      .DB.prepare("SELECT id FROM monitor_credentials WHERE id='default'")
      .first(),
  ]);
  return json({
    categories: categories.results,
    results: results.results,
    loginReady: Boolean(credential),
    day: wibDay(),
    shift,
  });
}

export async function POST(request: Request) {
  await ensureSchema();
  const auth = await authorized(request);
  if (!auth) return json({ error: "Silakan login kembali." }, 401);
  const body = await request.json<any>();
  const action = String(body.action || "");
  if (action === "save-credentials") {
    if (auth.internal) return json({ error: "Aksi tidak diizinkan." }, 403);
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    if (!username || !password)
      return json({ error: "Username dan password wajib diisi." }, 400);
    const encrypted = await encryptCredentials(username, password);
    await runtime()
      .DB.prepare(
        `INSERT INTO monitor_credentials(id,encrypted_value,updated_at)
      VALUES('default',?,?) ON CONFLICT(id) DO UPDATE SET encrypted_value=excluded.encrypted_value,updated_at=excluded.updated_at`,
      )
      .bind(encrypted, Date.now())
      .run();
    return json({ ok: true, loginReady: true });
  }
  if (action === "save-categories") {
    if (!Array.isArray(body.categories))
      return json({ error: "Daftar kategori tidak valid." }, 400);
    const categories = (body.categories as CategoryInput[]).slice(0, 100);
    const statements = [runtime().DB.prepare("DELETE FROM monitor_categories")];
    categories.forEach((item, index) => {
      if (!String(item.name || "").trim() || !String(item.url || "").trim())
        return;
      statements.push(
        runtime()
          .DB.prepare(
            `INSERT INTO monitor_categories
        (id,name,url,needs_login,active,sort_order,updated_at) VALUES(?,?,?,?,?,?,?)`,
          )
          .bind(
            String(item.id || crypto.randomUUID()),
            String(item.name).trim().toUpperCase(),
            normalizeUrl(String(item.url)),
            item.login ? 1 : 0,
            item.active === false ? 0 : 1,
            index,
            Date.now(),
          ),
      );
    });
    await runtime().DB.batch(statements);
    return json({ ok: true });
  }
  if (action === "run" || action === "run-scheduled") {
    const shift = body.shift === "malam" ? "malam" : "pagi";
    const results = await runChecks(
      shift,
      body.categoryId ? String(body.categoryId) : undefined,
    );
    return json({ ok: true, results, day: wibDay(), shift });
  }
  if (action === "delete-results") {
    await runtime().DB.prepare("DELETE FROM monitor_screenshots").run();
    return json({ ok: true });
  }
  return json({ error: "Aksi tidak dikenal." }, 400);
}
