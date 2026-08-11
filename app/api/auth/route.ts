import {
  cookie,
  currentUser,
  db,
  hashPassword,
  issueSession,
  random,
  sha,
  tokenFrom,
} from "../../lib/auth";

const json = (data: unknown, status = 200, headers?: HeadersInit) =>
  Response.json(data, { status, headers });

const emailValid = (email: string) => /^\S+@\S+\.\S+$/.test(email);

export async function GET(req: Request) {
  const user = await currentUser(req);
  return user
    ? json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        expiresAt: user.expires_at,
      })
    : json({ error: "Belum login" }, 401);
}

export async function POST(req: Request) {
  const body = await req.json<any>();
  const action = String(body.action || "");

  if (action === "register") {
    const name = String(body.name || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");
    if (name.length < 2 || !emailValid(email) || password.length < 8)
      return json(
        { error: "Nama, email, atau password minimal 8 karakter belum valid." },
        400,
      );
    if (
      await db()
        .prepare("SELECT id FROM users WHERE email=?")
        .bind(email)
        .first()
    )
      return json({ error: "Email sudah terdaftar." }, 409);

    const count = await db()
      .prepare("SELECT COUNT(*) total FROM users")
      .first<any>();
    const role = Number(count?.total || 0) === 0 ? "admin" : "user";
    const salt = random(16);
    const id = crypto.randomUUID();
    await db()
      .prepare(
        "INSERT INTO users(id,name,email,password_hash,password_salt,role,status,created_at) VALUES(?,?,?,?,?,?,?,?)",
      )
      .bind(
        id,
        name,
        email,
        await hashPassword(password, salt),
        salt,
        role,
        "active",
        Date.now(),
      )
      .run();
    const session = await issueSession(id);
    return json({ ok: true, role }, 201, {
      "Set-Cookie": cookie(session.token),
    });
  }

  if (action === "login") {
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");
    const user = await db()
      .prepare("SELECT * FROM users WHERE email=?")
      .bind(email)
      .first<any>();
    if (
      !user ||
      (await hashPassword(password, user.password_salt)) !== user.password_hash
    )
      return json({ error: "Email atau password salah." }, 401);
    if (user.status !== "active")
      return json({ error: "Akun disuspend, hubungi master." }, 403);
    const session = await issueSession(user.id);
    return json({ ok: true }, 200, { "Set-Cookie": cookie(session.token) });
  }

  if (action === "logout") {
    const token = tokenFrom(req);
    if (token)
      await db()
        .prepare("DELETE FROM sessions WHERE token_hash=?")
        .bind(await sha(token))
        .run();
    return json({ ok: true }, 200, { "Set-Cookie": cookie("", 0) });
  }

  const master = await currentUser(req);
  if (!master || master.role !== "admin")
    return json({ error: "Hanya master yang dapat mengelola pengguna." }, 403);

  if (action === "list-users") {
    const result = await db()
      .prepare(
        "SELECT id,name,email,role,status,created_at FROM users ORDER BY CASE WHEN role='admin' THEN 0 ELSE 1 END, created_at DESC",
      )
      .all();
    return json({ users: result.results });
  }

  const targetId = String(body.id || "");
  const target = targetId
    ? await db()
        .prepare("SELECT id,role FROM users WHERE id=?")
        .bind(targetId)
        .first<any>()
    : null;
  if (!target) return json({ error: "Pengguna tidak ditemukan." }, 404);
  if (target.role === "admin" && target.id !== master.id)
    return json({ error: "Akun master lain tidak dapat diubah." }, 403);

  if (action === "update-user") {
    if (target.id === master.id)
      return json({ error: "Data master tidak diubah dari panel ini." }, 400);
    const name = String(body.name || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    if (name.length < 2 || !emailValid(email))
      return json({ error: "Nama atau email belum valid." }, 400);
    try {
      await db()
        .prepare("UPDATE users SET name=?,email=? WHERE id=?")
        .bind(name, email, target.id)
        .run();
      return json({ ok: true });
    } catch {
      return json({ error: "Email sudah digunakan pengguna lain." }, 409);
    }
  }

  if (action === "reset-password") {
    if (target.id === master.id)
      return json(
        { error: "Gunakan pengaturan akun untuk password master." },
        400,
      );
    const password = String(body.password || "");
    if (password.length < 8)
      return json({ error: "Password baru minimal 8 karakter." }, 400);
    const salt = random(16);
    await db()
      .prepare("UPDATE users SET password_hash=?,password_salt=? WHERE id=?")
      .bind(await hashPassword(password, salt), salt, target.id)
      .run();
    await db()
      .prepare("DELETE FROM sessions WHERE user_id=?")
      .bind(target.id)
      .run();
    return json({ ok: true });
  }

  if (action === "set-status") {
    if (target.id === master.id)
      return json({ error: "Akun master tidak dapat dinonaktifkan." }, 400);
    const status = body.status === "active" ? "active" : "inactive";
    await db()
      .prepare("UPDATE users SET status=? WHERE id=?")
      .bind(status, target.id)
      .run();
    if (status === "inactive")
      await db()
        .prepare("DELETE FROM sessions WHERE user_id=?")
        .bind(target.id)
        .run();
    return json({ ok: true });
  }

  if (action === "delete-user") {
    if (target.id === master.id)
      return json({ error: "Master tidak dapat menghapus akun sendiri." }, 400);
    await db()
      .prepare("DELETE FROM sessions WHERE user_id=?")
      .bind(target.id)
      .run();
    await db().prepare("DELETE FROM users WHERE id=?").bind(target.id).run();
    return json({ ok: true });
  }

  return json({ error: "Aksi tidak dikenal." }, 400);
}
