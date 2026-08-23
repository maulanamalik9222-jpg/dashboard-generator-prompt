"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  status?: "active" | "disabled";
  created_at?: number;
  access?: string[];
  staffRole?: "master" | "assistant" | "staff";
  approvalStatus?: "pending" | "approved";
};
const MENU_ACCESS_OPTIONS = [["kemenangan","Postingan Kemenangan"],["syair","Postingan Syair"],["prediksi","Postingan Prediksi"],["jadwal","Perubahan Jadwal"],["validasi","Validasi Dana"],["usdt","Update USDT"],["result","Keterlambatan Result"],["bola","Prediksi Bola"],["monitor","Cek Link Situs Otomatis"],["handover","Data Serah Terima"],["resultTracker","Result Pasaran"],["resultArchive","Arsip Hasil Result"]] as const;

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
  const [notice, setNotice] = useState("");
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
  const [editAccess, setEditAccess] = useState<string[]>([]);
  const [editStaffRole, setEditStaffRole] = useState<"assistant" | "staff">("staff");
  const [canSetRole, setCanSetRole] = useState(false);

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
      setCanSetRole(Boolean(data.canSetRole));
      setManagementOpen(true);
    } catch (cause: any) {
      setManagementError(cause.message);
    }
  };

  useEffect(() => {
    const open = () => {
      if (user?.role === "admin" || user?.staffRole === "assistant") loadUsers();
    };
    const close = () => {
      setManagementOpen(false);
      setEditor(null);
      setManagementError("");
    };
    window.addEventListener("premankaro:open-user-management", open);
    window.addEventListener("premankaro:close-user-management", close);
    return () => {
      window.removeEventListener("premankaro:open-user-management", open);
      window.removeEventListener("premankaro:close-user-management", close);
    };
  }, [user]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedForm = event.currentTarget;
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const data=await api({ action: mode, ...Object.fromEntries(form) });
      if(mode === "register" && data.pending){
        setMode("login");
        setNotice(data.message || "Pendaftaran berhasil. Tunggu persetujuan master.");
        submittedForm.reset();
      }else await load();
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
    setEditAccess(Array.isArray(target.access)?target.access:MENU_ACCESS_OPTIONS.map(([id])=>id));
    setEditStaffRole(target.staffRole === "assistant" ? "assistant" : "staff");
    setNewPassword("");
  };

  const submitEditor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;
    if (editor.mode === "edit")
      await runUserAction(editor.user, "update-user", {
        name: editName,
        email: editEmail,
        access: editAccess,
        ...(canSetRole ? { staffRole: editStaffRole } : {}),
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
              : "Akun baru harus disetujui Master sebelum dapat masuk."}
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
          {notice && <b className="authNotice">{notice}</b>}
          <button>{mode === "login" ? "Masuk" : "Daftar Sekarang"}</button>
          <a
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
              setNotice("");
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
          {user.role === "admin" ? "MASTER" : user.staffRole === "assistant" ? "ASISTEN MASTER" : "STAFF"} · {user.name}
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

      {managementOpen && (user.role === "admin" || user.staffRole === "assistant") && (
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
              <h2>Kontrol User</h2>
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
              <b>ROLE</b>
              <b>KONTROL AKSES</b>
            </div>
            <div className="managementUsers">
              {users.map((target) => {
                const active = target.status === "active";
                const pending = target.approvalStatus === "pending";
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
                        className={pending ? "statusPending" : active ? "statusActive" : "statusInactive"}
                      >
                        {pending ? "MENUNGGU" : active ? "AKTIF" : "TIDAK AKTIF"}
                      </span>
                    </div>
                    <div><span className={`roleBadge role-${isMaster ? "master" : target.staffRole === "assistant" ? "assistant" : "staff"}`}>{isMaster ? "MASTER" : target.staffRole === "assistant" ? "ASISTEN MASTER" : "STAFF"}</span></div>
                    <div className="managementActions">
                      {isMaster ? (
                        <em>Khusus MASTER</em>
                      ) : pending ? (
                        user.role === "admin" ? <>
                          <button className="approveAccess" disabled={busyId===target.id} onClick={()=>runUserAction(target,"approve-user")}>Setujui Akun</button>
                          <button className="deleteAccess" disabled={busyId===target.id} onClick={()=>{if(confirm(`Tolak dan hapus pendaftaran ${target.name}?`))runUserAction(target,"delete-user")}}>Tolak</button>
                        </> : <em>Menunggu persetujuan MASTER</em>
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
                                status: active ? "disabled" : "active",
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
                <label>
                  Role
                  <select value={editStaffRole} onChange={(event)=>setEditStaffRole(event.target.value === "assistant" ? "assistant" : "staff")} disabled={!canSetRole}>
                    <option value="assistant">Asisten Master</option>
                    <option value="staff">Staff</option>
                  </select>
                  {!canSetRole && <small>Hanya Master yang dapat mengubah role.</small>}
                </label>
                <fieldset className="menuAccessControl">
                  <legend>Kontrol akses menu</legend>
                  <p>Matikan menu yang tidak boleh dilihat atau dibuka oleh pengguna ini.</p>
                  <div>
                    {MENU_ACCESS_OPTIONS.map(([id,label])=>{const enabled=editAccess.includes(id);return <label className="menuAccessOption" key={id}><span><b>{label}</b><small>{enabled?"AKSES AKTIF":"AKSES OFF"}</small></span><input type="checkbox" checked={enabled} onChange={(event)=>setEditAccess(current=>event.target.checked?[...new Set([...current,id])]:(current.length>1?current.filter(menuId=>menuId!==id):current))}/></label>})}
                  </div>
                </fieldset>
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
        .userManagementModal{z-index:300;inset:0 0 0 290px;display:block;padding:46px clamp(24px,4vw,68px) 70px;overflow:auto;background:radial-gradient(circle at 86% 0,rgba(0,217,255,.18),transparent 34%),radial-gradient(circle at 58% 82%,rgba(255,230,0,.07),transparent 31%),repeating-linear-gradient(135deg,rgba(0,217,255,.018) 0 1px,transparent 1px 8px),#02080b;backdrop-filter:none}
        .userManagementBox{width:min(1440px,100%);max-height:none;margin:0 auto;padding:0;overflow:hidden;border-color:rgba(0,217,255,.32);border-radius:22px;background:linear-gradient(145deg,#071820,#02090d);box-shadow:0 28px 80px rgba(0,0,0,.48),0 0 45px rgba(0,217,255,.1)}
        .userManagementModal .adminClose{z-index:4;right:25px;top:20px;width:42px;height:42px;border:1px solid rgba(0,217,255,.3);border-radius:12px;color:#eaffff;background:#0b222b;font-family:"Lexend",Arial,sans-serif;font-size:25px;line-height:1}
        .userManagementHead{display:block;max-width:none;margin:0;padding:32px 34px 27px;border-bottom:1px solid rgba(0,217,255,.2);background:radial-gradient(circle at 80% 0,rgba(0,217,255,.14),transparent 45%)}.userManagementHead>span,.userEditor>span{color:#ffe600;font-family:"Lexend",Arial,sans-serif;font-size:11px;font-weight:900;letter-spacing:.18em}.userManagementHead h2,.userEditor h2{margin:9px 0 7px;font-family:"Lexend",Arial,sans-serif!important;font-size:clamp(28px,3vw,38px)!important;font-weight:900!important;line-height:1.15;color:transparent!important;background:linear-gradient(90deg,#00d9ff,#ffe600,#00ffa8,#ffe600,#00d9ff);background-size:320% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:managementTitleFlow 8s linear infinite;text-shadow:0 0 20px rgba(0,217,255,.14)}.userManagementHead p,.userEditor p{margin:0;color:#a7c6cd;font-family:"Lexend",Arial,sans-serif;font-size:13px;line-height:1.55}.managementError{margin:17px 28px 0;padding:13px;border:1px solid #ff5d6d66;border-radius:10px;color:#ffabb4;background:#39131a;font-family:"Lexend",Arial,sans-serif;font-size:12px}
        .userTableHead,.managementUserRow{display:grid;grid-template-columns:minmax(250px,1.15fr) 135px 165px minmax(390px,1.5fr);align-items:center;gap:18px;font-family:"Lexend",Arial,sans-serif}.userTableHead{padding:17px 30px;color:#9bbbc2;background:#061016;font-size:11px;font-weight:800;letter-spacing:.08em}.managementUsers{max-height:calc(100vh - 300px);min-height:230px;overflow:auto}.managementUserRow{min-height:100px;padding:17px 30px;border-top:1px solid rgba(0,217,255,.11)}.managementUserRow:hover{background:rgba(0,217,255,.04)}.managementIdentity{display:flex;align-items:center;gap:15px}.managementIdentity i{width:50px;height:50px;display:grid;place-items:center;border:1px solid rgba(0,217,255,.32);border-radius:14px;color:#00d9ff;background:linear-gradient(145deg,#12303a,#07161d);font-family:"Lexend",Arial,sans-serif;font-size:17px;font-style:normal;font-weight:900}.managementIdentity b,.managementIdentity small{display:block}.managementIdentity b{color:#edfaff;font-size:16px;line-height:1.25}.managementIdentity small{margin-top:5px;color:#86a5ad;font-size:11px}.statusActive,.statusInactive{display:inline-flex;min-width:108px;justify-content:center;padding:10px 14px;border-radius:99px;font-family:"Lexend",Arial,sans-serif;font-size:10px;font-weight:900}.statusActive{color:#001910;background:#34dfa0;box-shadow:0 0 18px #34dfa033}.statusInactive{color:#fff;background:#d93f55;box-shadow:0 0 18px #d93f5533}.managementActions{display:flex;flex-wrap:wrap;gap:9px}.managementActions button{min-height:38px;padding:10px 14px;border:1px solid rgba(0,217,255,.28);border-radius:9px;color:#00161b;background:#35d5d1;font-family:"Lexend",Arial,sans-serif;font-size:10px;font-weight:900}.managementActions button:disabled{opacity:.45}.managementActions .resetAccess{background:#a88aff}.managementActions .suspendAccess{background:#ffb343}.managementActions .activateAccess{background:#38dfa1}.managementActions .deleteAccess{color:#fff;background:#a9273b}.managementActions em{color:#ffe600;font-size:13px;font-style:normal;font-weight:900}.userEditorModal{z-index:320}.userEditor{position:relative;width:min(540px,94vw);padding:30px;border:1px solid rgba(0,217,255,.34);border-radius:18px;color:#fff;background:linear-gradient(145deg,#0b2029,#030a0e);box-shadow:0 30px 100px #000}.userEditor label{display:grid;gap:8px;margin-top:18px;color:#a8c2c9;font-family:"Lexend",Arial,sans-serif;font-size:11px;font-weight:800}.userEditor input,.userEditor select{width:100%;padding:14px;border:1px solid rgba(0,217,255,.24);border-radius:9px;color:#fff;background:#020a0e;font-family:"Lexend",Arial,sans-serif;font-size:12px}.userEditor>div{display:flex;justify-content:flex-end;gap:10px;margin-top:24px}.userEditor>div button{padding:12px 16px;border:1px solid #52636a;border-radius:9px;color:#dfecef;background:#18272d;font-family:"Lexend",Arial,sans-serif;font-size:10px;font-weight:900}.userEditor>div .saveUser{color:#001317;background:linear-gradient(135deg,#ffe600,#00d9ff)}
        .roleBadge{display:inline-flex;min-width:118px;justify-content:center;padding:10px 13px;border-radius:99px;font-family:"Lexend",Arial,sans-serif;font-size:9px;font-weight:900}.role-master{color:#241700;background:#ffe600}.role-assistant{color:#001b22;background:linear-gradient(90deg,#00d9ff,#34dfa0)}.role-staff{color:#fff;background:#6658cc}.userEditor select:disabled{opacity:.6}
        .menuAccessControl{margin:22px 0 0;padding:18px;border:1px solid rgba(0,217,255,.24);border-radius:13px;background:rgba(0,217,255,.035)}.menuAccessControl legend{padding:0 8px;color:#ffe600;font-family:"Lexend",Arial,sans-serif;font-size:12px;font-weight:900}.menuAccessControl>p{margin:0 0 13px;color:#86a5ad;font-size:10px}.menuAccessControl>div{display:grid;grid-template-columns:1fr 1fr;gap:8px}.userEditor .menuAccessOption{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0;padding:11px 12px;border:1px solid rgba(0,217,255,.16);border-radius:9px;background:#06141a}.menuAccessOption span,.menuAccessOption b,.menuAccessOption small{display:block}.menuAccessOption b{color:#eaffff;font-size:10px}.menuAccessOption small{margin-top:4px;color:#38dfa1;font-size:7px;font-weight:900}.menuAccessOption:has(input:not(:checked)) small{color:#ff7888}.userEditor .menuAccessOption input{appearance:none;width:42px;height:23px;margin:0;padding:0;border:1px solid #49636b!important;border-radius:99px;background:#17272d!important;cursor:pointer}.userEditor .menuAccessOption input::before{content:"";display:block;width:17px;height:17px;margin:2px;border-radius:50%;background:#81959b;transition:.2s}.userEditor .menuAccessOption input:checked{border-color:#23dba0!important;background:#116d57!important}.userEditor .menuAccessOption input:checked::before{transform:translateX(18px);background:#3dffbd;box-shadow:0 0 10px #3dffbd}.userEditorModal .userEditor{max-height:92vh;overflow:auto}
        .teamUpAuthCard .authNotice{display:block;margin-top:12px;padding:12px;border:1px solid rgba(52,223,160,.45);border-radius:10px;color:#79f6c7;background:rgba(21,100,76,.2);font-size:11px;line-height:1.5}.statusPending{display:inline-flex;min-width:108px;justify-content:center;padding:10px 14px;border-radius:99px;color:#2b2100;background:#ffd55d;box-shadow:0 0 18px #ffd55d33;font-family:"Lexend",Arial,sans-serif;font-size:10px;font-weight:900}.managementActions .approveAccess{background:#34dfa0}
        @keyframes managementTitleFlow{to{background-position:320% 50%}}
        [data-theme="light"] .userManagementModal{background:radial-gradient(circle at 86% 0,rgba(0,196,255,.15),transparent 34%),radial-gradient(circle at 58% 82%,rgba(255,225,0,.12),transparent 31%),#edf8fa}[data-theme="light"] .userManagementBox{border-color:rgba(0,145,180,.28);background:linear-gradient(145deg,#fff,#e8f5f7);box-shadow:0 24px 65px rgba(20,94,109,.15)}[data-theme="light"] .userManagementHead{background:radial-gradient(circle at 80% 0,rgba(0,196,255,.13),transparent 45%)}[data-theme="light"] .userManagementHead p{color:#496c74}[data-theme="light"] .userTableHead{color:#385d65;background:#dceff2}[data-theme="light"] .managementUserRow{border-color:rgba(0,145,180,.15)}[data-theme="light"] .managementIdentity b{color:#16343b}[data-theme="light"] .managementIdentity small{color:#66858c}
        @media(max-width:900px){.userManagementModal{inset:0;padding:18px}.userTableHead{display:none}.managementUserRow{grid-template-columns:1fr;gap:14px;padding:20px}.managementActions{justify-content:flex-start}.userManagementHead{padding:26px 22px}.managementUsers{max-height:none}.userManagementHead h2{font-size:27px!important}.menuAccessControl>div{grid-template-columns:1fr}}
      `}</style>
    </>
  );
}
