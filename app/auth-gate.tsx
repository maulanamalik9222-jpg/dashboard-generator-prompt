"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  status?: "active" | "inactive";
  created_at?: number;
};

async function api(body?: unknown) {
  const response = await fetch(
    "/api/auth",
    body
      ? {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }
      : {},
  );
  const text = await response.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: "Server tidak mengirim respons yang valid." };
  }
  if (!response.ok)
    throw new Error(data.error || `Server error (${response.status})`);
  return data;
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [managementOpen, setManagementOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [managementError, setManagementError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [editor, setEditor] = useState<{
    mode: "edit" | "password";
    user: User;
  } | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const load = () =>
    api()
      .then((data) => {
        setUser(data.user);
        const left = Math.max(0, data.expiresAt - Date.now());
        window.setTimeout(() => location.reload(), left + 500);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const loadUsers = async () => {
    setManagementError("");
    try {
      const data = await api({ action: "list-users" });
      setUsers(data.users || []);
      setManagementOpen(true);
    } catch (cause: any) {
      setManagementError(cause.message);
    }
  };

  useEffect(() => {
    const open = () => {
      if (user?.role === "admin") loadUsers();
    };
    window.addEventListener("premankaro:open-user-management", open);
    return () =>
      window.removeEventListener("premankaro:open-user-management", open);
  }, [user]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api({ action: mode, ...Object.fromEntries(form) });
      await load();
    } catch (cause: any) {
      setError(cause.message);
    }
  }

  const runUserAction = async (target: User, action: string, extra = {}) => {
    setBusyId(target.id);
    setManagementError("");
    try {
      await api({ action, id: target.id, ...extra });
      await loadUsers();
    } catch (cause: any) {
      setManagementError(cause.message);
    } finally {
      setBusyId("");
    }
  };

  const openEditor = (target: User, editorMode: "edit" | "password") => {
    setEditor({ mode: editorMode, user: target });
    setEditName(target.name);
    setEditEmail(target.email);
    setNewPassword("");
  };

  const submitEditor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;
    if (editor.mode === "edit")
      await runUserAction(editor.user, "update-user", {
        name: editName,
        email: editEmail,
      });
    else
      await runUserAction(editor.user, "reset-password", {
        password: newPassword,
      });
    setEditor(null);
  };

  if (loading)
    return (
      <div className="authPage teamUpAuthPage">
        <div className="authCard teamUpAuthCard authLoading">Memuat dashboard...</div>
      </div>
    );

  if (!user)
    return (
      <div className="authPage teamUpAuthPage">
        <form className="authCard teamUpAuthCard" onSubmit={submit}>
          <div className="authLogo teamUpAuthLogo">
            <img src="/logo-up-premium-transparent.png" alt="Team UP" />
          </div>
          <h1 className="authGradientTitle">{mode === "login" ? "Masuk ke Team UP" : "Buat akun baru"}</h1>
          <p>
            {mode === "login"
              ? "Gunakan email dan password Anda."
              : "Akun langsung aktif setelah pendaftaran."}
          </p>
          {mode === "register" && (
            <input name="name" placeholder="Nama lengkap" required />
          )}
          <input name="email" type="email" placeholder="Email" required />
          <input
            name="password"
            type="password"
            minLength={8}
            placeholder="Password minimal 8 karakter"
            required
          />
          {error && <b className="authError">{error}</b>}
          <button>{mode === "login" ? "Masuk" : "Daftar Sekarang"}</button>
          <a
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login"
              ? "Belum punya akun? Daftar"
              : "Sudah punya akun? Masuk"}
          </a>
        </form>
      </div>
    );

  return (
    <>
      <div className="userBar">
        <span>
          {user.role === "admin" ? "MASTER" : "USER"} · {user.name}
        </span>
        <button
          onClick={() =>
            api({ action: "logout" }).then(() => location.reload())
          }
        >
          Keluar
        </button>
      </div>
      {children}

      {managementOpen && user.role === "admin" && (
        <div className="adminModal userManagementModal">
          <div className="adminBox userManagementBox">
            <button
              className="adminClose"
              onClick={() => setManagementOpen(false)}
            >
              ×
            </button>
            <header className="userManagementHead">
              <span>MASTER CONTROL</span>
              <h2>Manajemen User</h2>
              <p>
                Kelola pengguna terdaftar, status login, data akun, dan reset
                password.
              </p>
            </header>
            {managementError && (
              <div className="managementError">{managementError}</div>
            )}
            <div className="userTableHead">
              <b>NAMA USER</b>
              <b>STATUS</b>
              <b>KONTROL AKSES</b>
            </div>
            <div className="managementUsers">
              {users.map((target) => {
                const active = target.status !== "inactive";
                const isMaster = target.role === "admin";
                return (
                  <div className="managementUserRow" key={target.id}>
                    <div className="managementIdentity">
                      <i>{target.name.slice(0, 1).toUpperCase()}</i>
                      <span>
                        <b>{target.name}</b>
                        <small>{target.email}</small>
                      </span>
                    </div>
                    <div>
                      <span
                        className={active ? "statusActive" : "statusInactive"}
                      >
                        {active ? "AKTIF" : "TIDAK AKTIF"}
                      </span>
                    </div>
                    <div className="managementActions">
                      {isMaster ? (
                        <em>Khusus MASTER</em>
                      ) : (
                        <>
                          <button
                            disabled={busyId === target.id}
                            onClick={() => openEditor(target, "edit")}
                          >
                            Edit
                          </button>
                          <button
                            className="resetAccess"
                            disabled={busyId === target.id}
                            onClick={() => openEditor(target, "password")}
                          >
                            Reset Password
                          </button>
                          <button
                            className={
                              active ? "suspendAccess" : "activateAccess"
                            }
                            disabled={busyId === target.id}
                            onClick={() =>
                              runUserAction(target, "set-status", {
                                status: active ? "inactive" : "active",
                              })
                            }
                          >
                            {active ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                          <button
                            className="deleteAccess"
                            disabled={busyId === target.id}
                            onClick={() => {
                              if (
                                confirm(
                                  `Hapus akun ${target.name} secara permanen?`,
                                )
                              )
                                runUserAction(target, "delete-user");
                            }}
                          >
                            Hapus
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {editor && (
        <div className="adminModal userEditorModal">
          <form className="userEditor" onSubmit={submitEditor}>
            <button
              type="button"
              className="adminClose"
              onClick={() => setEditor(null)}
            >
              ×
            </button>
            <span>USER CONTROL</span>
            <h2>
              {editor.mode === "edit" ? "Edit Pengguna" : "Reset Password"}
            </h2>
            <p>
              {editor.user.name} · {editor.user.email}
            </p>
            {editor.mode === "edit" ? (
              <>
                <label>
                  Nama user
                  <input
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(event) => setEditEmail(event.target.value)}
                    required
                  />
                </label>
              </>
            ) : (
              <label>
                Password baru
                <input
                  type="password"
                  minLength={8}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Minimal 8 karakter"
                  required
                />
              </label>
            )}
            <div>
              <button type="button" onClick={() => setEditor(null)}>
                Batal
              </button>
              <button className="saveUser">Simpan Perubahan</button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .teamUpAuthPage{--auth-one:#00d9ff;--auth-two:#ffe600;--auth-three:#00ffa8;position:relative;isolation:isolate;overflow:hidden;font-family:"Lexend","Nunito",Arial,sans-serif;background:radial-gradient(circle at 16% 10%,rgba(255,230,0,.13),transparent 31%),radial-gradient(circle at 86% 8%,rgba(0,217,255,.2),transparent 36%),radial-gradient(circle at 54% 100%,rgba(0,255,168,.1),transparent 38%),repeating-linear-gradient(135deg,rgba(0,217,255,.018) 0 1px,transparent 1px 9px),#02080b!important}
        .teamUpAuthPage::before{content:"";position:fixed;z-index:-1;inset:-55vmax;background:conic-gradient(from 0deg,transparent 0 12%,rgba(0,217,255,.5) 20%,transparent 32%,rgba(255,230,0,.38) 47%,transparent 61%,rgba(0,255,168,.4) 74%,transparent 88%);filter:blur(110px);opacity:.2;animation:authAmbientOrbit 30s linear infinite;pointer-events:none}
        .teamUpAuthCard{position:relative;width:min(450px,100%);padding:34px;border:1px solid rgba(0,217,255,.32)!important;border-radius:24px!important;color:#eaffff;background:linear-gradient(145deg,rgba(7,25,32,.98),rgba(2,9,13,.99))!important;box-shadow:0 30px 100px rgba(0,0,0,.7),0 0 42px rgba(0,217,255,.1),inset 0 1px rgba(255,255,255,.04)!important;overflow:hidden}
        .teamUpAuthCard::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,transparent,var(--auth-one),var(--auth-two),var(--auth-three),transparent);background-size:240% 100%;animation:authEnergyLine 4s linear infinite}
        .teamUpAuthLogo{width:78px!important;height:78px!important;padding:5px;border:1px solid rgba(0,217,255,.28);border-radius:19px!important;background:radial-gradient(circle,rgba(0,217,255,.15),rgba(255,230,0,.04),transparent 70%)!important;box-shadow:0 0 28px rgba(0,217,255,.15)}
        .teamUpAuthLogo img{display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 0 8px rgba(0,217,255,.55)) drop-shadow(0 0 10px rgba(255,230,0,.25));animation:authLogoFloat 4s ease-in-out infinite}
        .teamUpAuthCard .authGradientTitle{margin:22px 0 9px;font-family:"Lexend","Nunito",Arial,sans-serif!important;font-size:clamp(25px,5vw,32px)!important;font-weight:900;line-height:1.15;letter-spacing:.01em;color:transparent!important;background:linear-gradient(90deg,var(--auth-one),var(--auth-two),var(--auth-three),var(--auth-two),var(--auth-one));background-size:320% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:authTitleFlow 8s linear infinite;text-shadow:0 0 22px rgba(0,217,255,.13)}
        .teamUpAuthCard p{margin-bottom:15px;color:#9bc1c8!important;font-family:"Lexend","Nunito",Arial,sans-serif!important;font-size:11px!important;line-height:1.6}
        .teamUpAuthCard input{margin-top:12px;padding:15px 16px!important;border:1px solid rgba(0,217,255,.24)!important;border-radius:12px!important;outline:none;color:#ebffff!important;background:rgba(1,9,13,.88)!important;font-family:"Lexend","Nunito",Arial,sans-serif!important;font-size:12px;transition:.2s}
        .teamUpAuthCard input::placeholder{color:#6f9299}.teamUpAuthCard input:focus{border-color:var(--auth-one)!important;box-shadow:0 0 0 3px rgba(0,217,255,.09),0 0 22px rgba(0,217,255,.08)}
        .teamUpAuthCard>button{padding:15px!important;border:1px solid rgba(255,230,0,.35)!important;color:#001317!important;background:linear-gradient(110deg,var(--auth-two),var(--auth-three),var(--auth-one))!important;background-size:220% 100%!important;font-family:"Lexend","Nunito",Arial,sans-serif!important;font-size:12px;font-weight:900!important;box-shadow:0 12px 32px rgba(0,217,255,.15);animation:authButtonFlow 6s linear infinite}
        .teamUpAuthCard>button:hover{filter:brightness(1.12);transform:translateY(-1px)}.teamUpAuthCard>a{color:#dffcff!important;font-family:"Lexend","Nunito",Arial,sans-serif!important;font-weight:700;text-decoration:none}.teamUpAuthCard>a:hover{color:var(--auth-two)!important}.teamUpAuthCard .authError{color:#ff8e9b}
        .authLoading{text-align:center;color:transparent!important;background-color:#06151b!important;background-image:linear-gradient(90deg,var(--auth-one),var(--auth-two),var(--auth-three))!important;background-clip:text!important;-webkit-background-clip:text!important;-webkit-text-fill-color:transparent;font-weight:900}
        @keyframes authAmbientOrbit{to{transform:rotate(360deg)}}@keyframes authTitleFlow{to{background-position:320% 50%}}@keyframes authEnergyLine{to{background-position:240% 0}}@keyframes authButtonFlow{to{background-position:220% 0}}@keyframes authLogoFloat{50%{transform:translateY(-4px) scale(1.025);filter:drop-shadow(0 0 13px rgba(0,217,255,.75)) drop-shadow(0 0 14px rgba(255,230,0,.35))}}
        .userManagementModal{z-index:300}.userManagementBox{width:min(1180px,96vw);max-height:90vh;padding:0;overflow:hidden;border-color:rgba(0,217,255,.32);background:linear-gradient(145deg,#071820,#02090d);box-shadow:0 35px 120px #000,0 0 45px rgba(0,217,255,.12)}
        .userManagementHead{padding:26px 28px 20px;border-bottom:1px solid rgba(0,217,255,.2);background:radial-gradient(circle at 80% 0,rgba(0,217,255,.14),transparent 45%)}.userManagementHead>span,.userEditor>span{color:#ffe600;font-size:9px;font-weight:900;letter-spacing:.18em}.userManagementHead h2,.userEditor h2{margin:6px 0;color:#f7fcff;font-size:27px}.userManagementHead p,.userEditor p{margin:0;color:#8facb5;font-size:11px}.managementError{margin:14px 22px 0;padding:11px;border:1px solid #ff5d6d66;border-radius:9px;color:#ff9aa5;background:#39131a;font-size:10px}.userTableHead,.managementUserRow{display:grid;grid-template-columns:minmax(260px,1.2fr) 150px minmax(390px,1.5fr);align-items:center;gap:14px}.userTableHead{padding:13px 24px;color:#8ca8b0;background:#061016;font-size:9px;letter-spacing:.08em}.managementUsers{max-height:60vh;overflow:auto}.managementUserRow{min-height:82px;padding:13px 24px;border-top:1px solid rgba(0,217,255,.11)}.managementUserRow:hover{background:rgba(0,217,255,.035)}.managementIdentity{display:flex;align-items:center;gap:12px}.managementIdentity i{width:42px;height:42px;display:grid;place-items:center;border:1px solid rgba(0,217,255,.28);border-radius:12px;color:#00d9ff;background:linear-gradient(145deg,#12303a,#07161d);font-style:normal;font-weight:900}.managementIdentity b,.managementIdentity small{display:block}.managementIdentity b{color:#edfaff;font-size:13px}.managementIdentity small{margin-top:4px;color:#78959d;font-size:9px}.statusActive,.statusInactive{display:inline-flex;min-width:92px;justify-content:center;padding:8px 12px;border-radius:99px;font-size:8px;font-weight:900}.statusActive{color:#001910;background:#34dfa0;box-shadow:0 0 18px #34dfa033}.statusInactive{color:#fff;background:#d93f55;box-shadow:0 0 18px #d93f5533}.managementActions{display:flex;flex-wrap:wrap;gap:7px}.managementActions button{padding:9px 11px;border:1px solid rgba(0,217,255,.28);border-radius:8px;color:#00161b;background:#35d5d1;font-size:8px;font-weight:900}.managementActions button:disabled{opacity:.45}.managementActions .resetAccess{background:#a88aff}.managementActions .suspendAccess{background:#ffb343}.managementActions .activateAccess{background:#38dfa1}.managementActions .deleteAccess{color:#fff;background:#a9273b}.managementActions em{color:#ffe600;font-size:11px;font-style:normal;font-weight:900}.userEditorModal{z-index:320}.userEditor{position:relative;width:min(500px,94vw);padding:26px;border:1px solid rgba(0,217,255,.34);border-radius:18px;color:#fff;background:linear-gradient(145deg,#0b2029,#030a0e);box-shadow:0 30px 100px #000}.userEditor label{display:grid;gap:7px;margin-top:17px;color:#9ab4bc;font-size:9px;font-weight:900}.userEditor input{width:100%;padding:13px;border:1px solid rgba(0,217,255,.24);border-radius:9px;color:#fff;background:#020a0e}.userEditor>div{display:flex;justify-content:flex-end;gap:9px;margin-top:22px}.userEditor>div button{padding:11px 15px;border:1px solid #52636a;border-radius:9px;color:#dfecef;background:#18272d;font-size:9px;font-weight:900}.userEditor>div .saveUser{color:#001317;background:linear-gradient(135deg,#ffe600,#00d9ff)}
        @media(max-width:820px){.userTableHead{display:none}.managementUserRow{grid-template-columns:1fr;gap:12px}.managementActions{justify-content:flex-start}.userManagementHead{padding:22px}.managementUsers{max-height:68vh}}
      `}</style>
    </>
  );
}
