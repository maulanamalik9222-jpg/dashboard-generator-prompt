export const runtime = "edge";

type Match = { time: string; date: string; home: string; away: string; score: string };
type League = { name: string; matches: Match[] };

const MONTHS = ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"];
const FIXED_SOURCE = "https://jpkoloni4d.pagesco.de/prediksi-bola-10-11-agustus-2026";

function jakartaDate(offset = 0) {
  const now = new Date(Date.now() + offset * 86_400_000);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  return { day: value("day"), month: value("month"), year: value("year") };
}

function dailySources() {
  const today = jakartaDate();
  const tomorrow = jakartaDate(1);
  const yesterday = jakartaDate(-1);
  const make = (a: typeof today, b: typeof today) => `https://jpkoloni4d.pagesco.de/prediksi-bola-${a.day}-${b.day}-${MONTHS[b.month - 1]}-${b.year}`;
  return Array.from(new Set([make(today, tomorrow), make(yesterday, today), FIXED_SOURCE]));
}

function decode(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&#039;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}

function parsePage(html: string): League[] {
  const leagues: League[] = [];
  const sectionPattern = /<section class="league-block"[^>]*>([\s\S]*?)<\/section>/gi;
  for (const section of html.matchAll(sectionPattern)) {
    const body = section[1];
    const name = decode(body.match(/<h3>([\s\S]*?)<\/h3>/i)?.[1] || "LIGA");
    const matches: Match[] = [];
    const rowPattern = /<article class="match-row"[^>]*>([\s\S]*?)<\/article>/gi;
    for (const row of body.matchAll(rowPattern)) {
      const item = row[1];
      const time = decode(item.match(/<div class="match-time">[\s\S]*?<strong>([\s\S]*?)<\/strong>/i)?.[1] || "-");
      const dateMeta = decode(item.match(/<div class="match-time">[\s\S]*?<span>([\s\S]*?)<\/span>/i)?.[1] || "");
      const teams = Array.from(item.matchAll(/<div class="match-teams">[\s\S]*?<b>([\s\S]*?)<\/b>[\s\S]*?<b>([\s\S]*?)<\/b>/gi))[0];
      const score = decode(item.match(/<div class="match-value">([\s\S]*?)<\/div>/i)?.[1] || "-");
      if (teams) matches.push({ time, date: dateMeta.replace(/^WIB\s*[•·-]?\s*/i, ""), home: decode(teams[1]), away: decode(teams[2]), score });
    }
    if (matches.length) leagues.push({ name, matches });
  }
  return leagues;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function makeWordPressScript(leagues: League[], title: string, sourceUrl: string, theme: string) {
  const id = `pk_bola_${Date.now().toString(36)}`;
  const sections = leagues.map((league) => `<section class="pk-league"><h3>${escapeHtml(league.name)}</h3><div class="pk-head"><span>TANGGAL / WAKTU</span><span>PERTANDINGAN</span><span>PREDIKSI SKOR</span></div>${league.matches.map((match) => `<div class="pk-row"><time>${escapeHtml(match.date)} ${escapeHtml(match.time)} WIB</time><div class="pk-teams"><b>${escapeHtml(match.home)}</b><i>VS</i><b>${escapeHtml(match.away)}</b></div><strong>${escapeHtml(match.score)}</strong></div>`).join("")}</section>`).join("");
  const dark = theme === "black";
  return `<div id="${id}" class="pk-wrap"><style>#${id}{--pk-main:${dark ? "#111827" : "#1769a8"};--pk-soft:${dark ? "#202938" : "#dceffc"};--pk-page:${dark ? "#0b1018" : "#edf8ff"};max-width:920px;margin:20px auto;padding:18px;border-radius:20px;background:var(--pk-page);color:${dark ? "#f5f7fb" : "#093353"};font-family:Arial,sans-serif;box-sizing:border-box}#${id} *{box-sizing:border-box}#${id} h2{text-align:center;font-size:24px;margin:5px 0 12px}#${id} .pk-source{display:block;margin:0 0 16px;text-align:center;color:${dark ? "#8dcaff" : "#075f9d"};font-size:12px}#${id} .pk-note{padding:11px;border:1px solid #69bfea;border-radius:9px;text-align:center;background:${dark ? "#152437" : "#bde5fb"};font-size:11px;font-weight:700}#${id} .pk-league{margin-top:16px;border-radius:13px;overflow:hidden;background:${dark ? "#151c27" : "#fff"};box-shadow:0 5px 18px #0012}#${id} .pk-league h3{margin:0;padding:13px;background:var(--pk-main);color:#fff;text-align:center;font-size:14px}#${id} .pk-head,#${id} .pk-row{display:grid;grid-template-columns:145px 1fr 115px;align-items:center}#${id} .pk-head{background:var(--pk-soft);font-size:10px;font-weight:800;text-align:center}#${id} .pk-head span,#${id} .pk-row>*{padding:11px;border-right:1px solid ${dark ? "#344052" : "#c4dfef"}}#${id} .pk-row{border-top:1px solid ${dark ? "#344052" : "#c4dfef"};font-size:12px}#${id} .pk-row time{text-align:center;font-weight:700}#${id} .pk-teams{display:flex;justify-content:center;align-items:center;gap:10px;text-align:center}#${id} .pk-teams i{flex:0 0 auto;padding:5px 7px;border-radius:20px;color:#fff;background:var(--pk-main);font-size:9px;font-style:normal}#${id} .pk-row>strong{text-align:center;color:${dark ? "#7dd3fc" : "#075f9d"};font-size:18px}@media(max-width:640px){#${id}{padding:10px}#${id} .pk-head{display:none}#${id} .pk-row{grid-template-columns:1fr}#${id} .pk-row>*{border-right:0;text-align:center}#${id} .pk-teams{padding-top:4px;padding-bottom:4px}}</style><h2>${escapeHtml(title)}</h2><a class="pk-source" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener">Sumber prediksi bola</a><div class="pk-note">SELAMAT DATANG DI PREDIKSI BOLA • SELALU UTAMAKAN PREDIKSI SENDIRI.</div>${sections}</div>`;
}

export async function GET(request: Request) {
  const requestedTheme = new URL(request.url).searchParams.get("theme") === "black" ? "black" : "blue";
  let lastError = "Sumber tidak dapat diakses.";
  for (const sourceUrl of dailySources()) {
    try {
      const response = await fetch(sourceUrl, { headers: { "user-agent": "Mozilla/5.0 (compatible; PremanKaroDashboard/1.0)" }, cf: { cacheEverything: true, cacheTtl: 900 } } as RequestInit & { cf: unknown });
      if (!response.ok) { lastError = `Sumber merespons HTTP ${response.status}`; continue; }
      const html = await response.text();
      const leagues = parsePage(html);
      if (!leagues.length) { lastError = "Format prediksi pada sumber belum terbaca."; continue; }
      const pageTitle = decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "Prediksi Bola").replace(/\s+Terbaru$/i, "");
      const title = pageTitle.replace(/^Prediksi Bola/i, "JADWAL BOLA").toUpperCase();
      const matchCount = leagues.reduce((total, league) => total + league.matches.length, 0);
      return Response.json({ title, sourceUrl, leagues, matchCount, leagueCount: leagues.length, fetchedAt: new Date().toISOString(), wpScript: makeWordPressScript(leagues, title, sourceUrl, requestedTheme) });
    } catch (error) { lastError = error instanceof Error ? error.message : "Gagal membaca sumber."; }
  }
  return Response.json({ error: lastError, sourceUrl: FIXED_SOURCE }, { status: 502 });
}
