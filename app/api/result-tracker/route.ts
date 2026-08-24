import { currentUser, db } from "../../lib/auth";

const LOCKED_SHIO_NUMBERS = [
  "01, 13, 25, 37, 49, 61, 73, 85, 97",
  "02, 14, 26, 38, 50, 62, 74, 86, 98",
  "03, 15, 27, 39, 51, 63, 75, 87, 99",
  "04, 16, 28, 40, 52, 64, 76, 88, 00",
  "05, 17, 29, 41, 53, 65, 77, 89",
  "06, 18, 30, 42, 54, 66, 78, 90",
  "07, 19, 31, 43, 55, 67, 79, 91",
  "08, 20, 32, 44, 56, 68, 80, 92",
  "09, 21, 33, 45, 57, 69, 81, 93",
  "10, 22, 34, 46, 58, 70, 82, 94",
  "11, 23, 35, 47, 59, 71, 83, 95",
  "12, 24, 36, 48, 60, 72, 84, 96",
] as const;

const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "cache-control": "no-store" } });

async function initializeSchema() {
  await db().batch([
    db().prepare(`CREATE TABLE IF NOT EXISTS result_markets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      shift TEXT NOT NULL CHECK(shift IN ('pagi','malam')),
      close_time TEXT NOT NULL,
      result_time TEXT NOT NULL,
      official_url TEXT NOT NULL DEFAULT '',
      result_official_url TEXT NOT NULL DEFAULT '',
      red_reference_url TEXT NOT NULL DEFAULT '',
      blue_reference_url TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`),
    db().prepare(`CREATE TABLE IF NOT EXISTS result_records (
      id TEXT PRIMARY KEY,
      market_id TEXT NOT NULL,
      result_date TEXT NOT NULL,
      prize_1 TEXT NOT NULL DEFAULT '',
      prize_2 TEXT NOT NULL DEFAULT '',
      prize_3 TEXT NOT NULL DEFAULT '',
      official_link TEXT NOT NULL DEFAULT '',
      red_reference_link TEXT NOT NULL DEFAULT '',
      blue_reference_link TEXT NOT NULL DEFAULT '',
      admin_result TEXT NOT NULL DEFAULT '',
      updated_by TEXT NOT NULL,
      updated_by_name TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(market_id,result_date)
    )`),
    db().prepare(
      "CREATE INDEX IF NOT EXISTS idx_result_records_date ON result_records(result_date)",
    ),
    db().prepare(`CREATE TABLE IF NOT EXISTS result_shio_settings (
      year INTEGER NOT NULL,
      shio_name TEXT NOT NULL,
      numbers TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      updated_by TEXT NOT NULL,
      PRIMARY KEY(year,shio_name)
    )`),
  ]);
  await db()
    .prepare("ALTER TABLE result_records ADD COLUMN is_cleared INTEGER NOT NULL DEFAULT 0")
    .run()
    .catch(() => null);
  await db().prepare("ALTER TABLE result_records ADD COLUMN red_reference_link TEXT NOT NULL DEFAULT ''").run().catch(() => null);
  await db().prepare("ALTER TABLE result_records ADD COLUMN blue_reference_link TEXT NOT NULL DEFAULT ''").run().catch(() => null);
  await db().prepare("ALTER TABLE result_markets ADD COLUMN result_official_url TEXT NOT NULL DEFAULT ''").run().catch(() => null);
  await db().prepare("ALTER TABLE result_markets ADD COLUMN red_reference_url TEXT NOT NULL DEFAULT ''").run().catch(() => null);
  await db().prepare("ALTER TABLE result_markets ADD COLUMN blue_reference_url TEXT NOT NULL DEFAULT ''").run().catch(() => null);
}

let schemaReady: Promise<void> | null = null;
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = initializeSchema().catch((cause) => {
      schemaReady = null;
      throw cause;
    });
  }
  return schemaReady;
}

async function canManage(user: any) {
  if (user.role === "admin") return true;
  const row = await db()
    .prepare("SELECT staff_role FROM user_staff_roles WHERE user_id=?")
    .bind(user.id)
    .first<{ staff_role: string }>()
    .catch(() => null);
  return row?.staff_role === "assistant";
}

const cleanTime = (value: unknown) => {
  const text = String(value || "").trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(text) ? text : "";
};

const cleanDate = (value: unknown) => {
  const text = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
};

export async function GET(req: Request) {
  const user = await currentUser(req);
  if (!user) return json({ error: "Sesi login tidak valid." }, 401);
  await ensureSchema();
  const url = new URL(req.url);
  const date = cleanDate(url.searchParams.get("date"));
  const month = Number(url.searchParams.get("month") || 0);
  const year = Number(url.searchParams.get("year") || 0);
  const currentView = url.searchParams.get("view") === "current";
  const shioYear = Number(url.searchParams.get("shioYear") || new Date().getFullYear());

  let query = `SELECT r.id,r.market_id marketId,m.name marketName,m.shift,
    r.result_date resultDate,m.close_time closeTime,m.result_time resultTime,
    r.prize_1 prize1,r.prize_2 prize2,r.prize_3 prize3,
    r.official_link officialLink,r.red_reference_link redReferenceLink,r.blue_reference_link blueReferenceLink,r.admin_result adminResult,
    r.updated_at updatedAt,r.updated_by_name updatedByName
    FROM result_records r JOIN result_markets m ON m.id=r.market_id`;
  let statement;
  if (date) {
    statement = db().prepare(`${query} WHERE r.result_date=?${currentView ? " AND r.is_cleared=0" : ""} ORDER BY m.shift,m.sort_order,m.name`).bind(date);
  } else if (year >= 2000 && month >= 1 && month <= 12) {
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    statement = db().prepare(`${query} WHERE substr(r.result_date,1,7)=? ORDER BY r.result_date DESC,m.shift,m.sort_order,m.name`).bind(prefix);
  } else if (year >= 2000) {
    statement = db().prepare(`${query} WHERE substr(r.result_date,1,4)=? ORDER BY r.result_date DESC,m.shift,m.sort_order,m.name`).bind(String(year));
  } else {
    statement = db().prepare(`${query} ORDER BY r.result_date DESC,m.shift,m.sort_order,m.name LIMIT 300`);
  }
  const [markets, records, shioSettings, manageAccess] = await Promise.all([
    db().prepare(
      `SELECT id,name,shift,close_time closeTime,result_time resultTime,
       official_url officialUrl,result_official_url resultOfficialUrl,
       red_reference_url redReferenceUrl,blue_reference_url blueReferenceUrl,
       active FROM result_markets
       ORDER BY CASE shift WHEN 'pagi' THEN 0 ELSE 1 END,sort_order,name`,
    ).all(),
    statement.all(),
    db().prepare("SELECT shio_name name,numbers FROM result_shio_settings WHERE year=? ORDER BY rowid").bind(shioYear).all(),
    canManage(user),
  ]);
  return json({
    markets: markets.results,
    records: records.results,
    canManage: manageAccess,
    shioYear,
    shioSettings: shioSettings.results,
  });
}

export async function POST(req: Request) {
  const user = await currentUser(req);
  if (!user) return json({ error: "Sesi login tidak valid." }, 401);
  await ensureSchema();
  const body = await req.json<any>().catch(() => ({}));
  const action = String(body.action || "");

  if (action === "save-market") {
    if (!(await canManage(user)))
      return json({ error: "Hanya Master atau Asisten Master yang dapat mengatur pasaran." }, 403);
    const name = String(body.name || "").trim().toUpperCase();
    const shift = body.shift === "malam" ? "malam" : "pagi";
    const closeTime = cleanTime(body.closeTime);
    const resultTime = cleanTime(body.resultTime);
    const officialUrl = String(body.officialUrl || "").trim();
    if (!name || !closeTime || !resultTime)
      return json({ error: "Nama pasaran, jam tutup, dan jam result wajib diisi." }, 400);
    const id = String(body.id || crypto.randomUUID());
    const now = Date.now();
    const existing = await db().prepare("SELECT id FROM result_markets WHERE id=?").bind(id).first();
    if (existing) {
      await db().prepare(`UPDATE result_markets SET name=?,shift=?,close_time=?,result_time=?,official_url=?,active=?,updated_at=? WHERE id=?`)
        .bind(name,shift,closeTime,resultTime,officialUrl,body.active === false ? 0 : 1,now,id).run();
    } else {
      const order = await db().prepare("SELECT COALESCE(MAX(sort_order),0)+1 next_order FROM result_markets").first<{next_order:number}>();
      await db().prepare(`INSERT INTO result_markets(id,name,shift,close_time,result_time,official_url,active,sort_order,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)`)
        .bind(id,name,shift,closeTime,resultTime,officialUrl,body.active === false ? 0 : 1,Number(order?.next_order || 1),now,now).run();
    }
    return json({ ok: true, id });
  }

  if (action === "delete-market") {
    if (!(await canManage(user))) return json({ error: "Akses ditolak." }, 403);
    const id = String(body.id || "");
    await db().batch([
      db().prepare("DELETE FROM result_records WHERE market_id=?").bind(id),
      db().prepare("DELETE FROM result_markets WHERE id=?").bind(id),
    ]);
    return json({ ok: true });
  }

  if (action === "save-result") {
    const marketId = String(body.marketId || "");
    const resultDate = cleanDate(body.resultDate);
    if (!marketId || !resultDate)
      return json({ error: "Pasaran dan tanggal result wajib tersedia." }, 400);
    const market = await db().prepare("SELECT id FROM result_markets WHERE id=? AND active=1").bind(marketId).first();
    if (!market) return json({ error: "Pasaran tidak ditemukan atau tidak aktif." }, 404);
    const prize1 = String(body.prize1 || "").trim();
    const prize2 = String(body.prize2 || "").trim();
    const prize3 = String(body.prize3 || "").trim();
    const officialLink = String(body.officialLink || "").trim();
    const redReferenceLink = String(body.redReferenceLink || "").trim();
    const blueReferenceLink = String(body.blueReferenceLink || "").trim();
    const adminResult = String(body.adminResult || "").trim();
    const now = Date.now();
    await db().prepare("UPDATE result_markets SET result_official_url=?,red_reference_url=?,blue_reference_url=?,updated_at=? WHERE id=?")
      .bind(officialLink,redReferenceLink,blueReferenceLink,now,marketId).run();
    const existing = await db().prepare("SELECT id FROM result_records WHERE market_id=? AND result_date=?").bind(marketId,resultDate).first<{id:string}>();
    if (existing) {
      await db().prepare(`UPDATE result_records SET prize_1=?,prize_2=?,prize_3=?,official_link=?,red_reference_link=?,blue_reference_link=?,admin_result=?,updated_by=?,updated_by_name=?,updated_at=?,is_cleared=0 WHERE id=?`)
        .bind(prize1,prize2,prize3,officialLink,redReferenceLink,blueReferenceLink,adminResult,user.id,user.name,now,existing.id).run();
    } else {
      await db().prepare(`INSERT INTO result_records(id,market_id,result_date,prize_1,prize_2,prize_3,official_link,red_reference_link,blue_reference_link,admin_result,updated_by,updated_by_name,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .bind(crypto.randomUUID(),marketId,resultDate,prize1,prize2,prize3,officialLink,redReferenceLink,blueReferenceLink,adminResult,user.id,user.name,now,now).run();
    }
    return json({ ok: true });
  }

  if (action === "reset-day-results") {
    if (!(await canManage(user)))
      return json({ error: "Hanya Master atau Asisten Master yang dapat mereset semua hasil." }, 403);
    const resultDate = cleanDate(body.resultDate);
    if (!resultDate) return json({ error: "Tanggal result tidak valid." }, 400);
    const update = await db()
      .prepare("UPDATE result_records SET is_cleared=1,updated_at=? WHERE result_date=?")
      .bind(Date.now(), resultDate)
      .run();
    return json({ ok: true, archived: Number(update.meta?.changes || 0) });
  }

  if(action === "save-shio-settings"){
    if(!(await canManage(user))) return json({error:"Hanya Master atau Asisten Master yang dapat mengatur shio."},403);
    const year=Number(body.year);
    const settings=Array.isArray(body.settings)?body.settings:[];
    if(year<2020||year>2100||settings.length!==12) return json({error:"Tahun atau tabel shio belum lengkap."},400);
    const normalized=settings.map((item:any,index:number)=>({name:String(item.name||"").trim().toUpperCase(),numbers:LOCKED_SHIO_NUMBERS[index]}));
    if(normalized.some((item:any)=>!item.name)) return json({error:"Semua nama shio wajib diisi."},400);
    if(new Set(normalized.map((item:any)=>item.name)).size!==12) return json({error:"Nama shio tidak boleh sama atau duplikat."},400);
    await db().prepare("DELETE FROM result_shio_settings WHERE year=?").bind(year).run();
    const now=Date.now();
    for(const item of normalized) await db().prepare("INSERT INTO result_shio_settings(year,shio_name,numbers,updated_at,updated_by) VALUES(?,?,?,?,?)").bind(year,item.name,item.numbers,now,user.id).run();
    return json({ok:true});
  }

  return json({ error: "Aksi tidak dikenali." }, 400);
}
