import { currentUser, db } from "../../lib/auth";

const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "cache-control": "no-store" } });

let schemaReady: Promise<unknown> | null = null;
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = db()
      .prepare(`CREATE TABLE IF NOT EXISTS bank_site_accounts (
        id TEXT PRIMARY KEY,
        bank_type TEXT NOT NULL,
        account_name TEXT NOT NULL,
        account_number TEXT NOT NULL UNIQUE,
        created_by TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`)
      .run()
      .catch((cause) => {
        schemaReady = null;
        throw cause;
      });
  }
  return schemaReady;
}

const cleanText = (value: unknown, max = 120) =>
  String(value || "").replace(/\s+/g, " ").trim().slice(0, max);

const cleanNumber = (value: unknown) =>
  String(value || "").replace(/\D/g, "").slice(0, 40);

export async function GET(req: Request) {
  const user = await currentUser(req);
  if (!user) return json({ error: "Sesi login tidak valid." }, 401);
  await ensureSchema();
  const rows = await db()
    .prepare(`SELECT id,bank_type bankType,account_name accountName,
      account_number accountNumber,created_at createdAt
      FROM bank_site_accounts
      ORDER BY bank_type,account_name,account_number`)
    .all();
  return json({ accounts: rows.results });
}

export async function POST(req: Request) {
  const user = await currentUser(req);
  if (!user) return json({ error: "Sesi login tidak valid." }, 401);
  await ensureSchema();
  const body = await req.json<any>().catch(() => ({}));
  const action = String(body.action || "");

  if (action === "save") {
    const bankType = cleanText(body.bankType, 40).toUpperCase();
    const accountName = cleanText(body.accountName).toUpperCase();
    const accountNumber = cleanNumber(body.accountNumber);
    if (!bankType || !accountName || accountNumber.length < 4)
      return json({ error: "Jenis bank, nama rekening, dan nomor rekening wajib diisi." }, 400);
    const now = Date.now();
    const id = cleanText(body.id, 80) || crypto.randomUUID();
    const existing = await db()
      .prepare("SELECT id FROM bank_site_accounts WHERE account_number=? OR id=? LIMIT 1")
      .bind(accountNumber, id)
      .first<{ id: string }>();
    if (existing) {
      await db()
        .prepare("UPDATE bank_site_accounts SET bank_type=?,account_name=?,account_number=?,updated_at=? WHERE id=?")
        .bind(bankType, accountName, accountNumber, now, existing.id)
        .run();
      return json({ ok: true, id: existing.id });
    }
    await db()
      .prepare(`INSERT INTO bank_site_accounts
        (id,bank_type,account_name,account_number,created_by,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?)`)
      .bind(id, bankType, accountName, accountNumber, user.id, now, now)
      .run();
    return json({ ok: true, id });
  }

  if (action === "delete") {
    const id = cleanText(body.id, 80);
    if (!id) return json({ error: "Data rekening tidak ditemukan." }, 400);
    await db().prepare("DELETE FROM bank_site_accounts WHERE id=?").bind(id).run();
    return json({ ok: true });
  }

  return json({ error: "Aksi tidak dikenali." }, 400);
}
