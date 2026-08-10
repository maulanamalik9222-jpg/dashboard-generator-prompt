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
  const id = "TU_PRO_msml7o7z_dewxb";
  const initials = (name: string) => name.replace(/\[[^\]]+\]/g, "").trim().split(/\s+/).slice(0, 2).map((word) => word[0] || "").join("").toUpperCase();
  const logo = (name: string) => `https://tse2.mm.bing.net/th?q=${encodeURIComponent(name + " football logo")}&w=120&h=120&c=7`;
  const options = leagues.map((league, index) => `<option value="lg${index}">${escapeHtml(league.name)}</option>`).join("");
  const sections = leagues.map((league, leagueIndex) => `<section class="tu-league" data-league="lg${leagueIndex}"><div class="tu-league-title"><span>🏆</span><b>${escapeHtml(league.name)}</b><span>🏆</span></div>${league.matches.map((match, index) => `<article class="tu-match" style="--delay:${index * 35}ms"><div class="tu-team tu-left"><div class="tu-name">${escapeHtml(match.home)}</div><div class="tu-logo"><span>${initials(match.home)}</span><img src="${logo(match.home)}" alt="${escapeHtml(match.home)}" onerror="this.style.display='none'"></div></div><div class="tu-mid"><div class="tu-vs">PREDICTION</div><div class="tu-score">${escapeHtml(match.score.replace(/\s+/g, ""))}</div><div class="tu-time">${escapeHtml(match.date)} ${escapeHtml(match.time)} WIB</div></div><div class="tu-team tu-right"><div class="tu-logo"><span>${initials(match.away)}</span><img src="${logo(match.away)}" alt="${escapeHtml(match.away)}" onerror="this.style.display='none'"></div><div class="tu-name">${escapeHtml(match.away)}</div></div></article>`).join("")}</section>`).join("");
  const accent = theme === "black" ? "#a7ff1e" : "#00ead3";
  return `<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Secular+One&display=swap" rel="stylesheet"><style>#${id}{--tu-accent:${accent};background-image:linear-gradient(135deg,rgba(1,5,10,.88),rgba(0,0,0,.72)),url('https://cdn.areabermain.club/assets/cdn/az5/2026/06/05/20260605/d8da4a05d3711f1bdceaf9506db9358b/8d0c53b281558afb9d8b5b8ed05f1e5a.jpg');background-size:cover;background-position:center;width:100%;margin:20px auto;border:2px solid var(--tu-accent);border-radius:24px;overflow:hidden;color:#fff;font-family:'Rajdhani',Arial,sans-serif;position:relative;box-shadow:0 0 32px color-mix(in srgb,var(--tu-accent) 40%,transparent);font-style:normal!important}#${id} *{box-sizing:border-box}#${id}:before{content:"";position:absolute;inset:0;background:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:38px 38px;pointer-events:none}#${id} .tu-inner{position:relative;padding:24px;background:linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,.5))}#${id} .tu-top{display:flex;flex-direction:column;align-items:center;text-align:center;padding:10px 0 16px}#${id} .tu-main-logo{display:block;width:240px;max-width:82%;filter:drop-shadow(0 0 12px var(--tu-accent));margin:0 auto 12px}#${id} .tu-title{padding:12px 20px;border:1px solid var(--tu-accent);border-radius:999px;background:#00ead31c;font-family:'Secular One';color:var(--tu-accent);font-size:clamp(16px,2.8vw,24px)}#${id} .tu-source{margin-top:10px;color:#a9fff7;font-size:10px}#${id} .tu-controls{display:grid;grid-template-columns:.8fr 1.4fr .8fr;gap:8px;margin:18px 0}#${id} .tu-info,#${id} .tu-select{border:1px solid var(--tu-accent);border-radius:12px;background:#000a;color:#fff;padding:8px;text-align:center;font-weight:800;min-height:44px;display:flex;align-items:center;justify-content:center;font-size:13px}#${id} .tu-select{color:var(--tu-accent);outline:none;width:100%}#${id} .tu-clock small,#${id} .tu-clock b{display:block}#${id} .tu-clock small{font-size:9px}#${id} .tu-ticker{overflow:hidden;border:1px solid #ffd76a59;border-radius:14px;background:#ffd76a12;margin-bottom:20px;white-space:nowrap}#${id} .tu-ticker span{display:inline-block;padding:11px 0;color:#ffd76a;font-weight:900;animation:tuTicker 18s linear infinite}@keyframes tuTicker{from{transform:translateX(100%)}to{transform:translateX(-100%)}}#${id} .tu-league-title{display:flex;align-items:center;justify-content:center;gap:12px;margin:20px 0 14px;padding:12px;border-block:1px solid var(--tu-accent);background:linear-gradient(90deg,transparent,#00ead338,transparent);color:var(--tu-accent);font-family:'Secular One';font-size:clamp(15px,2.2vw,20px)}#${id} .tu-match{position:relative;display:grid;grid-template-columns:1fr 130px 1fr;align-items:center;gap:10px;margin:12px 0;padding:14px 10px;border:2px solid color-mix(in srgb,var(--tu-accent) 70%,transparent);border-radius:20px;background:#050a14;animation:tuPop .45s ease both;animation-delay:var(--delay)}@keyframes tuPop{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}#${id} .tu-team{display:flex;align-items:center;gap:12px;min-width:0}#${id} .tu-left{justify-content:flex-end;text-align:right}#${id} .tu-right{justify-content:flex-start;text-align:left}#${id} .tu-name{font-family:'Secular One';font-size:clamp(11px,1.8vw,15px);line-height:1.2;flex:1;overflow-wrap:anywhere}#${id} .tu-logo{width:46px;height:46px;min-width:46px;border-radius:50%;border:2px solid var(--tu-accent);background:#fff;display:grid;place-items:center;position:relative;overflow:hidden}#${id} .tu-logo span{color:#021815;font-weight:900}#${id} .tu-logo img{position:absolute;inset:4px;width:calc(100% - 8px);height:calc(100% - 8px);object-fit:contain}#${id} .tu-mid{text-align:center;border-radius:16px;padding:8px 5px;background:linear-gradient(#00ead3,#058d84);color:#00110f}#${id} .tu-vs{font-weight:900;font-size:9px}#${id} .tu-score{font-family:'Secular One';font-size:clamp(20px,3.5vw,28px)}#${id} .tu-time{display:inline-block;border-radius:999px;background:#000b;color:#dffffc;padding:3px 8px;font-size:10px;font-weight:900;white-space:nowrap}#${id} .tu-foot{text-align:center;color:#ffffff99;font-size:11px;margin-top:18px}@media(max-width:760px){#${id} .tu-inner{padding:15px 8px}#${id} .tu-controls{grid-template-columns:1fr 1.5fr 1fr;gap:5px}#${id} .tu-info,#${id} .tu-select{font-size:10px;min-height:38px;padding:4px}#${id} .tu-match{grid-template-columns:1fr 85px 1fr;padding:10px 5px;gap:5px}#${id} .tu-logo{width:34px;height:34px;min-width:34px}#${id} .tu-name{font-size:10px}#${id} .tu-score{font-size:19px}#${id} .tu-time{font-size:8px;padding:2px 4px}}</style><div id="${id}"><div class="tu-inner"><div class="tu-top"><img class="tu-main-logo" src="https://cdn.areabermain.club/assets/cdn/az5/2026/05/29/20260529/891d078dfb7eafea9e076c4e6a0c8d44/togelup-togel-hijau-transparan-clean.png" alt="TOGELUP" onerror="this.style.display='none'"><div class="tu-title">🏆 WORLD CUP 2026 🏆</div><a class="tu-source" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener">BUKA LINK ACUAN PREDIKSI</a></div><div class="tu-controls"><div class="tu-info">MATCH: ${leagues.reduce((n, league) => n + league.matches.length, 0)}</div><select class="tu-select" data-tu-filter><option value="all">SEMUA LIGA</option>${options}</select><div class="tu-info tu-clock"><div><small>WAKTU</small><b data-tu-clock>--:--</b></div></div></div><div class="tu-ticker"><span>📣 Prediksi bola terupdate setiap hari • Cek jadwal, skor prediksi, dan liga favorit bosku! &nbsp;&nbsp;&nbsp; 📣 Prediksi bola terupdate setiap hari • Cek jadwal, skor prediksi, dan liga favorit bosku!</span></div><div class="tu-list">${sections}</div><div class="tu-foot">${escapeHtml(title)} • © Copyright 2026</div></div></div><script>(function(){var root=document.getElementById('${id}');if(!root)return;var sel=root.querySelector('[data-tu-filter]');if(sel)sel.addEventListener('change',function(){var v=this.value;root.querySelectorAll('.tu-league').forEach(function(x){x.style.display=v==='all'||x.getAttribute('data-league')===v?'block':'none'})});var clock=root.querySelector('[data-tu-clock]');function tick(){var p=new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).formatToParts(new Date()),m={};p.forEach(function(x){m[x.type]=x.value});clock.textContent=m.hour+':'+m.minute+':'+m.second+' WIB'}tick();setInterval(tick,1000)})();</script>`;
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
      const wpScript = makeWordPressScript(leagues, title, sourceUrl, requestedTheme)
        .replace(/<a class="tu-source"[\s\S]*?<\/a>/i, "")
        .replace(/#TU_PRO_msml7o7z_dewxb \.tu-source\{[^}]*\}/i, "");
      return Response.json({ title, sourceUrl, leagues, matchCount, leagueCount: leagues.length, fetchedAt: new Date().toISOString(), wpScript });
    } catch (error) { lastError = error instanceof Error ? error.message : "Gagal membaca sumber."; }
  }
  return Response.json({ error: lastError, sourceUrl: FIXED_SOURCE }, { status: 502 });
}
