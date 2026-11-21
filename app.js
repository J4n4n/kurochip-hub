/* ============================================================
   KuroChip Hub — app logic (Telegram Mini App + standalone web)
   ============================================================ */
'use strict';

/* ---------- Telegram WebApp ---------- */
const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
if (tg) {
  try {
    tg.ready();
    tg.expand();
    if (tg.setHeaderColor) tg.setHeaderColor('#0B0B0F');
    if (tg.setBackgroundColor) tg.setBackgroundColor('#0B0B0F');
  } catch (e) { /* standalone web page — keep going */ }
}
const haptic = {
  tap() { try { tg && tg.HapticFeedback.impactOccurred('light'); } catch (e) {} },
  ok()  { try { tg && tg.HapticFeedback.notificationOccurred('success'); } catch (e) {} },
  err() { try { tg && tg.HapticFeedback.notificationOccurred('error'); } catch (e) {} },
};
const botUser = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) ? tg.initDataUnsafe.user : null;

/* ---------- Utils ---------- */
const FA_DIGITS = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
const faNum = (n) => String(n).replace(/\d/g, d => FA_DIGITS[+d]);
const faNumGroup = (n) => faNum(Number(n).toLocaleString('en-US').replace(/,/g, '٬'));
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

const WEEKDAYS_FA = ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

/* ---------- Data: games (exactly these 6) ---------- */
const ICONS = {
  backgammon: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/><path d="M7 7v6M9.5 7v6M7 16v-3M9.5 16v-3M14.5 7v6M17 7v6M14.5 16v-3M17 16v-3"/></svg>`,
  connect4: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="2"/><circle cx="12" cy="9" r="2"/><circle cx="16" cy="9" r="2"/><circle cx="8" cy="15" r="2"/><circle cx="12" cy="15" r="2"/><circle cx="16" cy="15" r="2"/></svg>`,
  checkers: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/><circle cx="6" cy="6" r="1.6" fill="currentColor"/><circle cx="18" cy="12" r="1.6"/><circle cx="6" cy="18" r="1.6"/></svg>`,
  knucklebones: `<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/><circle cx="7.5" cy="7.5" r="1"/><circle cx="16.5" cy="16.5" r="1"/><circle cx="14.5" cy="14.5" r="1"/><circle cx="18.5" cy="18.5" r="1"/></svg>`,
  rps: `<svg viewBox="0 0 24 24"><path d="M7 12V6a1.6 1.6 0 0 1 3.2 0v5"/><path d="M10.2 11V4.8a1.6 1.6 0 0 1 3.2 0V11"/><path d="M13.4 11V6a1.6 1.6 0 0 1 3.2 0v7c0 4-2.4 7-6 7-3 0-4.8-1.6-6.2-4.4L3 12.6c-.6-1.1.8-2.2 1.8-1.4L7 12.8"/></svg>`,
  tictactoe: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M6.5 6.5l4 4m0-4-4 4M13.5 6.5h4M15.5 5v3M6.5 14h4M8.5 12.5v3"/><circle cx="15.5" cy="15.5" r="2.2"/></svg>`,
};
const GAMES = [
  { id:'backgammon', name:'تخته‌نرد', tagline:'بازی اصلی لابی — در برابر ربات', tags:['۵ تا ۱۵ دقیقه','رتبه‌دار'], hero:true,
    desc:'تخته‌نرد، بازی اصلی لابی است. با ربات یا دوستت بازی کن، مسابقه‌ی زنده و رتبه‌دار بگذار و رتبه‌ات را بالا ببر.',
    art:['rgba(212,165,66,.25)','rgba(212,165,66,.08)'], modes:[
      { id:'ai', title:'بازی با هوش مصنوعی', sub:'سه شخصیت رقیب: آسان، متوسط و سخت', cta:'بازی کن ←' },
      { id:'friend', title:'بازی با دوستان', sub:'اتاق خصوصی بساز و لینک چالش بفرست', cta:'ساخت اتاق ←' },
      { id:'online', title:'بازی آنلاین دو نفره', sub:'حریف واقعی، مسابقه‌ی زنده و رتبه‌دار', cta:'بازی کن ←' },
    ]},
  { id:'connect4', name:'چهارتایی (Connect 4)', tagline:'چهار تا در یک ردیف', tags:['۹۰ ثانیه','برق‌آسا'],
    desc:'چهار مهره در یک ردیف — در برابر ربات یا دوست. سریع فکر کن، زودتر ردیف را کامل کن.',
    art:['rgba(103,181,124,.18)','rgba(212,165,66,.08)'], modes:[
      { id:'ai', title:'در برابر ربات', sub:'سه سطح: آسان، متوسط و سخت', cta:'بازی کن ←' },
      { id:'friend', title:'دو نفره روی یک گوشی', sub:'یکی باشید، یکی برد', cta:'بازی کن ←' },
    ]},
  { id:'checkers', name:'دز و شهم (Checkers)', tagline:'کلاسیک همه‌ی دوران‌ها', tags:['۳ تا ۶ دقیقه','استراتژی'],
    desc:'مهره‌هایت را جلو ببر، رقیب را بگیر و به شه رسیدن برس. کلاسیکِ همیشه‌سبز، در برابر ربات.',
    art:['rgba(224,99,79,.15)','rgba(212,165,66,.07)'], modes:[
      { id:'ai', title:'در برابر ربات', sub:'بازی رتبه‌دار با امتیاز ELO', cta:'بازی کن ←' },
      { id:'friend', title:'دو نفره روی یک گوشی', sub:'نوبت اول با تو', cta:'بازی کن ←' },
    ]},
  { id:'knucklebones', name:'کنکل‌بونز (تاس)', tagline:'شانست را امتحان کن', tags:['۱ دقیقه','شانسی'],
    desc:'تاس بریز، ستون‌هایت را پر کن و ستون رقیب را بسرِت. تاسِ بیشتر در یک ستون، مهره‌ی رقیب را می‌سوزاند.',
    art:['rgba(212,165,66,.2)','rgba(224,99,79,.1)'], modes:[
      { id:'ai', title:'در برابر ربات', sub:'تاس بریز و ستون بساز', cta:'بازی کن ←' },
      { id:'friend', title:'دو نفره روی یک گوشی', sub:'نوبت اول با تو', cta:'بازی کن ←' },
    ]},
  { id:'rps', name:'سنگ کاغذ قیچی', tagline:'یک راند، یک تصمیم', tags:['زیر یک دقیقه','سریع'],
    desc:'سنگ، کاغذ، قیچی — کلاسیکِ سریع. در برابر ربات بازی کن و بردت را زنده ثبت کن.',
    art:['rgba(156,152,140,.18)','rgba(212,165,66,.06)'], modes:[
      { id:'ai', title:'در برابر ربات', sub:'برد رکوردت را بالا می‌برد', cta:'بازی کن ←' },
    ]},
  { id:'tictactoe', name:'دوز (Tic-Tac-Toe)', tagline:'مورد علاقه‌ی همه', tags:['زیر یک دقیقه','کلاسیک'],
    desc:'X و O روی صفحه‌ی ۳×۳ — سه تا در یک ردیف بگذار و مسابقه را ببر.',
    art:['rgba(103,181,124,.15)','rgba(212,165,66,.08)'], modes:[
      { id:'ai', title:'در برابر ربات', sub:'سه سطح سختی', cta:'بازی کن ←' },
      { id:'friend', title:'دو نفره روی یک گوشی', sub:'حرکت اول با توست', cta:'بازی کن ←' },
    ]},
];
const PACKS = [
  { id:'p500',  coins:500,   stars:10,  ton:'0.1'  },
  { id:'p1500', coins:1500,  stars:25,  ton:'0.25', best:true },
  { id:'p4000', coins:4000,  stars:50,  ton:'0.5'  },
  { id:'p12000',coins:12000, stars:100, ton:'1'    },
];
const TON_WALLET = 'UQC1terRdrWX8dJxYBUcfO0QUcTAJDsL67HwQLrdJY_-e9kJ';
const STARS_BOT = 'https://t.me/KuroChipBot';
const RANKS = [
  { id:'bronze',   name:'برنز',    min:0,    max:1049, color:'#C88A5A', gem:'#B5744A' },
  { id:'silver',   name:'نقره‌ای', min:1050, max:1249, color:'#B9C4CF', gem:'#8E9BA8' },
  { id:'gold',     name:'طلا',     min:1250, max:1499, color:'#D4A542', gem:'#D4A542' },
  { id:'platinum', name:'پلاتین',  min:1500, max:1799, color:'#8FD3D0', gem:'#6BB8B4' },
  { id:'diamond',  name:'الماس',   min:1800, max:9999, color:'#9AB8F0', gem:'#7A9BE0' },
];
const TROPHIES = [
  { id:'first-win',  name:'اولین برد' },
  { id:'five-wins',  name:'۵ برد' },
  { id:'challenge',  name:'چالش روزانه' },
  { id:'tournament', name:'جام هفتگی' },
  { id:'rich',       name:'۱۲٬۰۰۰ سکه' },
  { id:'streak3',    name:'زنجیره‌ی ۳ روزه' },
];

/* ---------- State (persisted locally; orders/status are confirmed by the bot server in production) ---------- */
const STORE_KEY = 'kurochip-hub-v2'; // v2: resets progress the old auto-resolve bug awarded falsely
const defaultState = () => ({
  name: botUser ? (botUser.first_name || 'بازیکن') : 'بازیکن',
  userTag: botUser ? (botUser.username ? '@' + botUser.username : 'id' + botUser.id) : 'مهمان',
  elo: 1020, xp: 0, coins: 240, tickets: 0, wins: 0, played: 0, sessions: 1,
  streakDay: 0, lastReward: null, today: todayKey(),
  tasks: { reward:false, play:false, win:false, invite:false },
  trophies: [],
  orders: [],
  history: [],
  tourneyEntered: false,
});
let S = defaultState();
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) { const saved = JSON.parse(raw); S = { ...defaultState(), ...saved, tasks:{...defaultState().tasks, ...(saved.tasks||{})} }; }
  } catch (e) {}
  // reset daily fields on a new day
  if (S.today !== todayKey()) {
    S.today = todayKey();
    S.tasks = { reward:false, play:false, win:false, invite:false };
    save();
  }
}
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) {} }

/* Seeded demo leaderboard — static fixture data for the boards (labelled as records, not real-money data) */
const BOARD_SEED = {
  daily: [
    { name:'آرش', elo:1495, pts:3120 }, { name:'سارا', elo:1380, pts:2750 }, { name:'کوروش', elo:1290, pts:2410 },
    { name:'نگار', elo:1210, pts:1980 }, { name:'امیر', elo:1150, pts:1750 }, { name:'پریسا', elo:1105, pts:1420 },
  ],
  alltime: [
    { name:'دیوان', elo:1860, pts:184500 }, { name:'آرتین', elo:1745, pts:151200 }, { name:'مینا', elo:1620, pts:128800 },
    { name:'سام', elo:1505, pts:110400 }, { name:'لیلا', elo:1420, pts:96700 }, { name:'بردیا', elo:1330, pts:84200 },
  ],
  beginner: [
    { name:'هلیا', elo:1085, pts:860 }, { name:'رضا', elo:1065, pts:740 }, { name:'شیوا', elo:1055, pts:655 },
    { name:'کامران', elo:1040, pts:520 }, { name:'نیلوفر', elo:1030, pts:430 },
  ],
};

/* ---------- Rank helpers ---------- */
function rankOf(elo) {
  const r = RANKS.find(r => elo >= r.min && elo <= r.max);
  const idx = RANKS.indexOf(r);
  const step = r.id === 'bronze' ? Math.floor((elo - 950) / 25) + 1 : Math.max(1, Math.ceil((elo - r.min + 1) / 50));
  return { ...r, index: idx, level: Math.max(1, step) };
}
function rankLabel(elo) { const r = rankOf(elo); return `${r.name} ${faNum(r.level)}`; }
function rankGem(r, size=34) {
  return `<svg class="rank-gem" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
    <defs><linearGradient id="g-${r.id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${r.color}"/><stop offset="1" stop-color="${r.gem}"/></linearGradient></defs>
    <path d="M12 2 20 9 12 22 4 9Z" fill="url(#g-${r.id})" opacity=".92"/>
    <path d="M12 2 20 9H4Z" fill="rgba(255,255,255,.35)"/>
  </svg>`;
}

/* ---------- Toasts & dialogs ---------- */
function toast(msg, coin=false) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = (coin ? `<img src="assets/coin.png" alt="">` : '') + `<span></span>`;
  el.querySelector('span').textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 3100);
}
function dialog({ icon, title, body, actions }) {
  const scrim = document.createElement('div');
  scrim.className = 'dialog-scrim';
  scrim.innerHTML = `<div class="dialog" role="dialog" aria-modal="true">
    ${icon || ''}
    <h3></h3><p></p>
    <div class="dialog-actions"></div>
  </div>`;
  scrim.querySelector('h3').textContent = title;
  if (body) scrim.querySelector('p').textContent = body; else scrim.querySelector('p').remove();
  const wrap = scrim.querySelector('.dialog-actions');
  actions.forEach(a => {
    const b = document.createElement(a.href ? 'a' : 'button');
    b.className = 'btn ' + (a.primary ? 'btn-primary' : 'btn-ghost');
    b.textContent = a.label;
    if (a.href) { b.href = a.href; b.target = '_blank'; b.rel = 'noopener'; }
    else b.addEventListener('click', () => { close(); a.onClick && a.onClick(); });
    wrap.appendChild(b);
  });
  const close = () => { scrim.classList.remove('is-open'); setTimeout(() => scrim.remove(), 280); };
  scrim.addEventListener('click', e => { if (e.target === scrim) close(); });
  document.body.appendChild(scrim);
  requestAnimationFrame(() => scrim.classList.add('is-open'));
}

/* ---------- Sheets (game modes) ---------- */
const sheet = $('#sheet'), scrim = $('#scrim');
let sheetCloseTimer = null;
function openSheet(html) {
  if (sheetCloseTimer) { clearTimeout(sheetCloseTimer); sheetCloseTimer = null; }
  sheet.innerHTML = `<div class="sheet-grab"></div>` + html;
  sheet.hidden = false; scrim.hidden = false;
  requestAnimationFrame(() => { sheet.classList.add('is-open'); scrim.classList.add('is-open'); });
  if (tg && tg.BackButton) try { tg.BackButton.show(); } catch(e){}
}
function closeSheet() {
  sheet.classList.remove('is-open'); scrim.classList.remove('is-open');
  if (tg && tg.BackButton) try { tg.BackButton.hide(); } catch(e){}
  clearTimeout(sheetCloseTimer);
  sheetCloseTimer = setTimeout(() => { sheet.hidden = true; scrim.hidden = true; sheetCloseTimer = null; }, 280);
}
scrim.addEventListener('click', closeSheet);
if (tg && tg.BackButton) tg.BackButton.onClick(closeSheet);

/* ---------- Navigation ---------- */
function goto(view) {
  $$('.view').forEach(v => v.classList.toggle('is-active', v.dataset.view === view));
  $$('.tab').forEach(t => t.classList.toggle('is-active', t.dataset.goto === view));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  haptic.tap();
}
document.addEventListener('click', e => {
  const nav = e.target.closest('[data-goto]');
  if (nav) goto(nav.dataset.goto);
});

/* ---------- Render: header ---------- */
function renderHeader() {
  $('#balance-num').textContent = faNumGroup(S.coins);
  $('#topbar-rank').textContent = rankLabel(S.elo);
  $('#shop-balance-num').textContent = faNumGroup(S.coins);
}

/* ---------- Render: home ---------- */
function renderGames() {
  $('#game-grid').innerHTML = GAMES.map(g => `
    <button class="game-card ${g.hero ? 'is-hero' : ''}" data-game="${g.id}">
      <div class="game-art" style="--c1:${g.art[0]};--c2:${g.art[1]}">
        ${g.id === 'backgammon' ? '<span class="tag">شاخص رتبه‌دار</span>' : ''}
        ${ICONS[g.id]}
      </div>
      <div class="game-body">
        <h3>${g.name}</h3>
        <p>${g.tagline}</p>
        <div class="game-meta">${g.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      </div>
    </button>`).join('');
}
function renderChallenge() {
  $('#daily-challenge-card').innerHTML = `
    <span class="challenge-badge" aria-hidden="true">${ICONS.backgammon.replace('<svg', '<svg class="challenge-svg" style="width:34px;height:34px;stroke:var(--accent-2);fill:none;stroke-width:1.6"')}</span>
    <div><h3>چالش روزانه</h3><p>هر روز یک مأموریت تازه با جایزه‌ی سکه</p></div>
    <span class="go">دیدن چالش ←</span>`;
  $('#challenge-detail').innerHTML = `
    <span class="tag">چالش امروز · تخته‌نرد</span>
    <p class="muted small" style="margin-top:var(--sp-2)">یک مسابقه‌ی تخته‌نرد در برابر ربات بازی کن — برد یا باخت، خودِ بازی کردن حساب است و جایزه‌ی سکه می‌گیری.</p>
    <div class="row">
      <button class="btn btn-primary" data-game="backgammon" data-mode="ai">شروع چالش ←</button>
      <span class="badge-coin"><img class="coin-img" src="assets/coin.png" alt=""> جایزه · ۷۵ سکه</span>
    </div>`;
}

/* ---------- Sheet: game modes ---------- */
document.addEventListener('click', e => {
  const card = e.target.closest('[data-game]');
  if (!card) return;
  const g = GAMES.find(x => x.id === card.dataset.game);
  if (!g) return;
  haptic.tap();
  const mode = card.dataset.mode;
  if (mode) { startGame(g, g.modes.find(m => m.id === mode) || g.modes[0]); return; }
  openSheet(`
    <h3>${g.name}</h3>
    <p class="sheet-sub">${g.desc}</p>
    <div class="mode-list">
      ${g.modes.map(m => `
        <button class="mode-btn" data-game="${g.id}" data-mode="${m.id}">
          <div><h4>${m.title}</h4><p>${m.sub}</p></div>
          <span class="go">${m.cta}</span>
        </button>`).join('')}
    </div>
    <p class="muted small" style="margin-top:var(--sp-4)">بازی همیشه رایگان است — سکه‌ها فقط امتیاز و رکوردند.</p>
  `);
});
const PLAYABLE_AI = {};
function startGame(game, mode) {
  closeSheet();
  // Bot mode on the playable boards opens the real game — nothing is
  // awarded until the player has actually finished a match.
  if (mode.id === 'ai' && PLAYABLE_AI[game.id]) { PLAYABLE_AI[game.id](game, mode); return; }
  // Other modes (online / friend rooms) are handled by the bot server in
  // the live product; the local preview records nothing here.
  dialog({
    title: game.name,
    body: 'این میز در لابی اصلی به سرور ربات وصل است. سکه و پیشرفت مأموریت فقط بعد از یک بازی واقعی ثبت می‌شود — بازی همیشه رایگان است.',
    actions: [{ label: 'بستن', primary: true, onClick: () => {} }],
  });
}

/* Called only after a real, finished match on the playable boards. */
function finishMatch(game, mode, win, draw) {
  S.played += 1;
  if (!S.tasks.play) S.tasks.play = true;
  const xpGain = 10 + (win ? 20 : 0);
  S.xp += xpGain;
  if (!draw) S.elo = Math.min(1999, S.elo + (win ? 18 : -8));
  if (win) {
    S.wins += 1;
    S.coins += 25;
    if (!S.tasks.win) S.tasks.win = true;
  }
  if (!S.trophies.includes('first-win') && S.wins >= 1) S.trophies.push('first-win');
  if (!S.trophies.includes('five-wins') && S.wins >= 5) S.trophies.push('five-wins');
  S.history.unshift({ game: game.name, mode: mode.title, win, draw: !!draw, at: Date.now() });
  save();
  renderAll();
  dialog({
    icon: `<img class="dialog-icon" src="assets/coin.png" alt="">`,
    title: draw ? 'مساوی' : win ? 'تو بردی' : 'باخت شدی',
    body: draw
      ? `مساوی شدی در ${game.name} — یک بازی دیگر؟`
      : win ? `+۲۵ سکه برای بردت در ${game.name} — مسابقه‌ی بعدی؟` : `این یکی مال رقیب بود — دوباره امتحان کن، مسابقه‌ها رایگان‌اند.`,
    actions: [
      { label:'بستن', primary:false, onClick:()=>{} },
      { label:'بازی دوباره', primary:true, onClick:()=>startGame(game, mode) },
    ],
  });
  win ? haptic.ok() : haptic.err();
}

/* ============================================================
   Playable bot-mode boards (state is a plain model, sheet is the view)
   ============================================================ */
let playHandler = null; // one live game handler at a time; set by each playable board
const BOARD_HTML = (title, sub, inner) => `
  <div class="play-head">
    <h3>${title}</h3><p class="sheet-sub">${sub}</p>
  </div>
  <div class="play-status" data-status></div>
  ${inner}
  <button class="btn btn-ghost btn-block" data-restart style="margin-top:var(--sp-3)">شروع دوباره</button>`;

function renderBoardGame(game, inner) {
  openSheet(BOARD_HTML(game.name, 'در برابر ربات — نوبت توست، ربات بعد از تو حرکت می‌کند.', inner));
}
sheet.addEventListener('click', e => { if (playHandler) playHandler(e); });

/* ---------- Tic-Tac-Toe ---------- */
PLAYABLE_AI.tictactoe = function (game, mode) {
  const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  let grid, turn, over;
  const winner = g => {
    for (const [a,b,c] of LINES) if (g[a] && g[a] === g[b] && g[a] === g[c]) return g[a];
    return g.every(Boolean) ? 'draw' : null;
  };
  const empties = g => g.map((v,i) => v ? null : i).filter(v => v !== null);
  function botPick() {
    for (const p of ['O','X']) for (const i of empties(grid)) {
      const t = [...grid]; t[i] = p;
      if (winner(t) === p) return i;
    }
    if (!grid[4]) return 4;
    const corners = [0,2,6,8].filter(i => !grid[i]);
    if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
    const free = empties(grid);
    return free[Math.floor(Math.random() * free.length)];
  }
  function view() {
    $('[data-status]', sheet).textContent = over
      ? ''
      : (turn === 'X' ? 'نوبت توست — یک خانه بردار' : 'ربات دارد فکر می‌کند…');
    $('[data-ttt]', sheet).innerHTML = grid.map((v, i) =>
      `<button class="ttt-cell" data-cell="${i}" ${v || over || turn !== 'X' ? 'disabled' : ''}>${v === 'X' ? '✕' : v === 'O' ? '◯' : ''}</button>`).join('');
  }
  function end(result) {
    over = true; view();
    finishMatch(game, mode, result === 'X');
  }
  function botTurn() {
    if (over) return;
    grid[botPick()] = 'O'; turn = 'X'; haptic.tap();
    view();
    const w = winner(grid);
    if (w) end(w); 
  }
  function play(i) {
    if (over || turn !== 'X' || grid[i]) return;
    grid[i] = 'X'; turn = 'O'; haptic.tap(); view();
    if (winner(grid)) return end(winner(grid));
    setTimeout(botTurn, 450);
  }
  function start() {
    grid = Array(9).fill(null); turn = 'X'; over = false;
    renderBoardGame(game, `<div class="ttt-grid" data-ttt></div>`);
    view();
    sheet.querySelectorAll('[data-cell]').forEach(() => {});
  }
  playHandler = function onCell(e) {
    const cell = e.target.closest('[data-cell]');
    if (cell) play(+cell.dataset.cell);
    if (e.target.closest('[data-restart]')) { start(); }
  };
  start();
};

/* ---------- Connect 4 ---------- */
PLAYABLE_AI.connect4 = function (game, mode) {
  const COLS = 7, ROWS = 6;
  let cols, over, busy = false;
  const lowest = c => { for (let r = ROWS - 1; r >= 0; r--) if (!cols[c][r]) return r; return -1; };
  function winnerAt(g, r, c) {
    const p = g[c][r];
    if (!p) return false;
    for (const [dc, dr] of [[1,0],[0,1],[1,1],[1,-1]]) {
      let n = 1;
      for (const s of [1, -1]) {
        let rr = r + dr * s, cc = c + dc * s;
        while (cc >= 0 && cc < COLS && rr >= 0 && rr < ROWS && g[cc][rr] === p) { n++; cc += dc * s; rr += dr * s; }
      }
      if (n >= 4) return true;
    }
    return false;
  }
  const winningCol = (g, p) => {
    for (let c = 0; c < COLS; c++) {
      const r = lowestCol(g, c);
      if (r < 0) continue;
      g[c][r] = p;
      const win = winnerAt(g, r, c);
      g[c][r] = null;
      if (win) return c;
    }
    return -1;
  };
  const lowestCol = (g, c) => { for (let r = ROWS - 1; r >= 0; r--) if (!g[c][r]) return r; return -1; };
  function botPick() {
    let c = winningCol(cols, 'O'); if (c >= 0) return c;
    c = winningCol(cols, 'X'); if (c >= 0) return c;
    const open = [];
    for (let i = 0; i < COLS; i++) if (lowestCol(cols, i) >= 0) open.push(i);
    const center = open.filter(i => i === 3);
    if (center.length && Math.random() < 0.6) return 3;
    return open[Math.floor(Math.random() * open.length)];
  }
  const full = () => cols.every(col => col[0]);
  function view() {
    $('[data-status]', sheet).textContent = over ? '' : (busy ? 'ربات دارد فکر می‌کند…' : 'نوبت توست — روی یک ستون بزن');
    $('[data-c4]', sheet).innerHTML = cols.map((col, c) => `
      <button class="c4-col" data-col="${c}" ${over || lowest(c) < 0 ? 'disabled' : ''} aria-label="ستون ${c+1}">
        ${col.map((v, r) => `<span class="c4-cell ${v ? 'is-' + v : ''}"></span>`).join('')}
      </button>`).join('');
  }
  function drop(c, p, isBot) {
    const r = lowest(c);
    if (r < 0 || over) return false;
    if (!isBot && busy) return false;
    if (!isBot) busy = true;
    cols[c][r] = p; haptic.tap(); view();
    if (winnerAt(cols, r, c) || cols.every(col => col[0])) { over = true; finishMatch(game, mode, p === 'X' && winnerAt(cols, r, c)); return true; }
    if (!isBot) setTimeout(() => { drop(botPick(), 'O', true); busy = false; view(); }, 450);
    return true;
  }
  function start() {
    cols = Array.from({ length: COLS }, () => Array(ROWS).fill(null));
    over = false; busy = false;
    renderBoardGame(game, `<div class="c4-grid" data-c4></div>`);
    view();
  }
  playHandler = function onCol(e) {
    const col = e.target.closest('[data-col]');
    if (col && !over && drop(+col.dataset.col, 'X')) {
      // bot reply is scheduled inside drop(); busy-lock blocks double drops
    }
    if (e.target.closest('[data-restart]')) start();
  };
  start();
};

/* ---------- Checkers ---------- */
PLAYABLE_AI.checkers = function (game, mode) {
  // Model: 8x8; 'p' player (bottom, moves up), 'b' bot (top, moves down), 'K'/'B' kings.
  let board, over, sel;
  const inside = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const dirsOf = p => (p === 'p' ? [[-1,-1],[-1,1]] : p === 'b' ? [[1,-1],[1,1]] : [[-1,-1],[-1,1],[1,-1],[1,1]]);
  const isOwn = (p, cell) => cell && (p === 'p' ? (cell === 'p' || cell === 'K') : (cell === 'b' || cell === 'B'));
  const isEnemy = (p, cell) => cell && (p === 'p' ? (cell === 'b' || cell === 'B') : (cell === 'p' || cell === 'K'));
  function pieceMoves(bd, r, c) {
    const p = bd[r][c]; if (!p) return { steps: [], jumps: [] };
    const dirs = dirsOf(p), steps = [], jumps = [];
    for (const [dr, dc] of dirs) {
      const r1 = r + dr, c1 = c + dc, r2 = r + 2 * dr, c2 = c + 2 * dc;
      if (inside(r1, c1) && !bd[r1][c1]) steps.push([r1, c1]);
      else if (inside(r2, c2) && isEnemy(p === 'p' ? 'p' : 'b', bd[r1][c1]) && !bd[r2][c2]) jumps.push([r2, c2]);
    }
    return { steps, jumps };
  }
  function allMoves(bd, p) {
    const out = { steps: [], jumps: [] };
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (isOwn(p, bd[r][c])) {
      const m = pieceMoves(bd, r, c);
      m.jumps.forEach(([r2, c2]) => out.jumps.push([r, c, r2, c2]));
      m.steps.forEach(([r2, c2]) => out.steps.push([r, c, r2, c2]));
    }
    return out;
  }
  function applyMove(bd, mv) {
    const [r, c, r2, c2] = mv;
    const bd2 = bd.map(row => [...row]);
    let p = bd2[r][c];
    bd2[r][c] = null;
    if (Math.abs(r2 - r) === 2) { // capture
      bd2[(r + r2) / 2][(c + c2) / 2] = null;
    }
    if ((p === 'p' && r2 === 0) || (p === 'b' && r2 === 7)) p = p === 'p' ? 'K' : 'B';
    bd2[r2][c2] = p;
    return bd2;
  }
  const hasAny = (bd, p) => bd.some((row, r) => row.some((cell, c) => {
    if (!isOwn(p, cell)) return false;
    const m = pieceMoves(bd, r, c);
    return m.steps.length || m.jumps.length;
  }));
  function botTurn() {
    if (over) return;
    const m = allMoves(board, 'b');
    const pool = m.jumps.length ? m.jumps : m.steps;
    if (!pool.length) { over = true; return finishMatch(game, mode, true); }
    const mv = pool[Math.floor(Math.random() * pool.length)];
    board = applyMove(board, mv);
    haptic.tap();
    view();
    if (!hasAny(board, 'p')) { over = true; return finishMatch(game, mode, true); }
  }
  function view() {
    const m = over ? { steps: [], jumps: [] } : allMoves(board, 'p');
    $('[data-status]', sheet).textContent = over ? '' : 'نوبت توست — مهره‌ات را بردار و حرکت بزن';
    $('[data-chk]', sheet).innerHTML = board.map((row, r) => row.map((cell, c) => {
      const dark = (r + c) % 2 === 1;
      const movable = m.steps.concat(m.jumps).some(([r1, c1]) => r1 === r && c1 === c);
      const target = m.steps.concat(m.jumps).some(([, , r2, c2]) => r2 === r && c2 === c);
      const pieceCls = cell ? (cell === 'p' ? 'is-p' : cell === 'b' ? 'is-b' : cell === 'K' ? 'is-p is-k' : 'is-b is-k') : '';
      return `<button class="chk-cell ${dark ? 'dark' : ''} ${movable ? 'can' : ''} ${target ? 'target' : ''}"
        data-r="${r}" data-c="${c}" ${(!dark && !cell) || over ? 'disabled' : ''}>
        ${cell ? `<span class="chk-piece ${pieceCls}"></span>` : ''}</button>`;
    }).join('')).join('');
  }
  function start() {
    board = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2) board[r][c] = 'b';
    for (let r = 5; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2) board[r][c] = 'p';
    over = false; sel = null;
    renderBoardGame(game, `<div class="chk-grid" data-chk></div>`);
    view();
  }
  playHandler = function onCell(e) {
    const cell = e.target.closest('[data-r]');
    if (cell && !over) {
      const r = +cell.dataset.r, c = +cell.dataset.c;
      const m = allMoves(board, 'p');
      const all = m.steps.concat(m.jumps);
      if (isOwn('p', board[r][c]) && all.some(([r1]) => r1 === r)) { sel = [r, c]; view(); return; }
      if (sel) {
        const opts = all.filter(([r1, c1]) => r1 === sel[0] && c1 === sel[1] && r2s(all, sel).includes(`${r},${c}`));
        const mv = opts[0];
        if (mv) {
          board = applyMove(board, mv); sel = null; haptic.tap(); view();
          if (!hasAny(board, 'b')) { over = true; return finishMatch(game, mode, true); }
          setTimeout(botTurn, 500);
          return;
        }
      }
      sel = null; view();
    }
    if (e.target.closest('[data-restart]')) start();
  };
  function r2s(all, sel) { return all.filter(([r1, c1]) => r1 === sel[0] && c1 === sel[1]).map(([, , r2, c2]) => `${r2},${c2}`); }
  start();
};

/* ---------- Rock Paper Scissors (bot) ---------- */
PLAYABLE_AI.rps = function (game, mode) {
  const HANDS = [
    { id: 'r', fa: 'سنگ' }, { id: 'p', fa: 'کاغذ' }, { id: 's', fa: 'قیچی' },
  ];
  const beats = { r: 's', p: 'r', s: 'p' };
  function view(locked) {
    $('[data-status]', sheet).textContent = locked ? 'ربات انتخابش را زد…' : 'انتخاب کن — یک دست، یک برد و باخت';
    $('[data-rps]', sheet).innerHTML = HANDS.map(h =>
      `<button class="rps-hand" data-hand="${h.id}" ${locked ? 'disabled' : ''}><span>${h.fa}</span></button>`).join('');
  }
  function start() {
    renderBoardGame(game, `<div class="rps-row" data-rps></div>`);
    view(false);
  }
  playHandler = function onHand(e) {
    const hand = e.target.closest('[data-hand]');
    if (hand) {
      const mine = hand.dataset.hand;
      const bot = HANDS[Math.floor(Math.random() * 3)].id;
      const win = mine !== bot && beats[mine] === bot;
      finishMatch(game, mode, win);
      return;
    }
    if (e.target.closest('[data-restart]')) start();
  };
  start();
};

/* ---------- Tasks ---------- */
function renderTasks() {
  $('#streak-day').textContent = faNum(S.streakDay + 1);
  $('#streak-dots').innerHTML = Array.from({length:7}, (_, i) => `<i class="${i < S.streakDay ? 'on' : ''}"></i>`).join('');
  const claimBtn = $('#btn-claim-reward');
  claimBtn.disabled = S.tasks.reward;
  claimBtn.textContent = S.tasks.reward ? 'جایزه‌ی امروز گرفته شد ✓' : 'دریافت بلیت رایگان';

  const tasks = [
    { id:'reward', t:'جایزه‌ی روزانه را بگیر', s:'هر روز یک بلیت رایگان جام.', r:'جایزه · ۱ بلیت + سکه' },
    { id:'play',   t:'یک مسابقه بازی کن',      s:'هر بازی، با هر نتیجه‌ای — خودِ بازی کردن حساب است.', r:'جایزه · پیشرفت در هر دو جدول' },
    { id:'win',    t:'یک مسابقه را ببر',       s:'یک بار در هر بازی ربات را شکست بده.', r:'جایزه · ۲۵+ سکه برای هر برد' },
    { id:'invite', t:'یک دوست را دعوت کن',     s:'لینک دعوت را برای دوستانت بفرست.', r:'جایزه · ۵۰ سکه' },
  ];
  $('#task-list').innerHTML = tasks.map(t => `
    <div class="task ${S.tasks[t.id] ? 'done' : ''}">
      <span class="task-check"><svg viewBox="0 0 24 24"><path d="m5 13 4 4L19 7"/></svg></span>
      <div><h4>${t.t}</h4><p>${t.s}</p></div>
      <span class="tag" style="margin-inline-start:auto">${t.r}</span>
    </div>`).join('');

  const trophiesWon = TROPHIES.filter(t => S.trophies.includes(t.id));
  $('#trophy-shelf').innerHTML = trophiesWon.length
    ? TROPHIES.map(t => `
      <div class="trophy ${S.trophies.includes(t.id) ? 'won' : ''}">
        <svg viewBox="0 0 24 24"><path d="M8 21h8M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/></svg>
        <span>${t.name}</span>
      </div>`).join('')
    : `<div class="trophy-empty">هنوز جامی نداری — با اولین بردت، اولین جامت روی قفسه می‌نشیند.</div>`;
}
$('#btn-claim-reward').addEventListener('click', () => {
  if (S.tasks.reward) return;
  S.tasks.reward = true;
  S.streakDay = Math.min(7, S.streakDay + 1);
  S.coins += 120;
  S.tickets += 1;
  if (!S.trophies.includes('streak3') && S.streakDay >= 3) S.trophies.push('streak3');
  save(); renderAll(); haptic.ok();
  dialog({
    icon: `<img class="dialog-icon" src="assets/coin.png" alt="">`,
    title: 'جایزه‌ی روزانه گرفت!',
    body: 'یک بلیت رایگان جام هفتگی + ۱۲۰ سکه به حساب‌ات اضافه شد. فردا دوباره برگرد تا زنجیره کامل شود.',
    actions: [{ label:'عالی!', primary:true, onClick:()=>{} }],
  });
});
document.addEventListener('click', e => {
  const inv = e.target.closest('#task-list .task:nth-child(4)');
  if (inv && !S.tasks.invite) {
    S.tasks.invite = true; S.coins += 50; save(); renderAll(); haptic.ok();
    toast('۵۰ سکه برای دعوت دوست اضافه شد', true);
  }
});

/* ---------- Leaderboard ---------- */
function renderBoard() {
  const active = $('#board-seg .is-active').dataset.board;
  const rows = BOARD_SEED[active];
  const me = { name: S.name + ' (تو)', elo: S.elo, pts: S.wins * 25 + S.played * 5, me: true };
  const all = [...rows.map(r => ({...r})), me].sort((a,b) => b.pts - a.pts);
  $('#board-list').innerHTML = all.slice(0, 8).map((r, i) => `
    <div class="board-row p${i+1} ${r.me ? 'me' : ''}">
      <span class="pos">${faNum(i+1)}</span>
      <div class="who"><b></b><span>${rankLabel(r.elo)} · ${r.me ? 'تو' : 'بازیکن'}</span></div>
      <span class="pts">${faNumGroup(r.pts)}</span>
    </div>`).join('');
  $$('#board-list .who b').forEach((b, i) => { b.textContent = all[i].name; });
}
$('#board-seg').addEventListener('click', e => {
  const btn = e.target.closest('.seg-btn'); if (!btn) return;
  $$('#board-seg .seg-btn').forEach(b => b.classList.toggle('is-active', b === btn));
  haptic.tap(); renderBoard();
});
function renderRanks() {
  const cur = rankOf(S.elo);
  $('#ranks').innerHTML = RANKS.map(r => `
    <div class="rank-row ${r.id === cur.id ? 'current' : ''}">
      ${rankGem(r)}
      <div><h4>${r.name}</h4><p>${r.id === cur.id ? 'رتبه‌ی فعلی تو' : 'رنک ' + r.name}</p></div>
      <span class="range">${r.max === 9999 ? faNum(r.min) + ' و بالاتر' : faNum(r.min) + ' – ' + faNum(r.max)}</span>
    </div>`).join('');
}
function renderBeginner() {
  const inBeginner = S.sessions <= 10;
  $('#board-beginner').innerHTML = inBeginner
    ? BOARD_SEED.beginner.map((r, i) => `
      <div class="board-row p${i+1}">
        <span class="pos">${faNum(i+1)}</span>
        <div class="who"><b>${r.name}</b><span>${rankLabel(r.elo)}</span></div>
        <span class="pts">${faNumGroup(r.pts)}</span>
      </div>`).join('')
    : `<div class="board-empty">نشست‌های اولت تمام شده — حالا جای تو در جدول اصلی است. موفق باشی!</div>`;
}
function renderStats() {
  const pct = S.played ? Math.round(S.wins / S.played * 100) : 0;
  $('#stat-band').innerHTML = `
    <div class="stat"><b>${faNum(S.wins)}</b><span>برد مسابقه</span></div>
    <div class="stat"><b>${faNum(S.played)}</b><span>مسابقه‌ی انجام‌شده</span></div>
    <div class="stat"><b>${faNum(pct)}٪</b><span>درصد برد</span></div>`;
}

/* ---------- Tournament ---------- */
function nextSunday() {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  const target = new Date(d);
  target.setDate(d.getDate() + ((7 - day) % 7 || 7));
  target.setHours(23, 59, 59, 999);
  return target;
}
let tourneyEnd = nextSunday();
function tickCountdown() {
  const ms = Math.max(0, tourneyEnd - Date.now());
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
  $('#countdown').innerHTML = [
    [d,'روز'], [h,'ساعت'], [m,'دقیقه'], [sec,'ثانیه'],
  ].map(([v, l]) => `<div class="unit"><b>${faNum(v)}</b><span>${l}</span></div>`).join('');
}
setInterval(tickCountdown, 1000);
$('#btn-tourney-enter').addEventListener('click', () => {
  if (S.tourneyEntered) { toast('از قبل وارد جام این هفته شده‌ای'); return; }
  if (S.tickets < 1) { haptic.err(); toast('بلیت نداری — جایزه‌ی روزانه را از تب وظایف بگیر'); goto('tasks'); return; }
  S.tickets -= 1; S.tourneyEntered = true; save(); haptic.ok();
  toast('وارد جام هفتگی شدی — موفق باشی!');
  renderHeader();
});

/* ---------- Shop ---------- */
let payMethod = 'stars';
$('#pay-seg').addEventListener('click', e => {
  const btn = e.target.closest('.seg-btn'); if (!btn) return;
  $$('#pay-seg .seg-btn').forEach(b => b.classList.toggle('is-active', b === btn));
  payMethod = btn.dataset.pay;
  haptic.tap(); renderPacks(); renderOrders();
});
function renderPacks() {
  $('#pack-grid').innerHTML = PACKS.map(p => `
    <div class="pack ${p.best ? 'pack-best' : ''}">
      ${p.best ? '<span class="ribbon">پرفروش‌ترین</span>' : ''}
      <div class="pack-coins"><img class="coin-img" src="assets/coin.png" alt=""> ${faNumGroup(p.coins)}</div>
      <div class="pack-price">${payMethod === 'stars' ? faNum(p.stars) + ' استارز' : p.ton + ' TON'}</div>
      <button class="btn ${p.best ? 'btn-primary' : 'btn-ghost'}" data-pack="${p.id}">خرید</button>
    </div>`).join('');
}
function renderOrders() {
  const wrap = $('#orders');
  if (!S.orders.length) {
    wrap.innerHTML = `<div class="orders-empty">هنوز سفارشی نداری. بسته‌ها بالا هستند — بازی همیشه رایگان است.</div>`;
    return;
  }
  wrap.innerHTML = `<div class="orders">` + [...S.orders].reverse().map(o => {
    const pack = PACKS.find(p => p.id === o.pack);
    const pending = o.status === 'pending';
    return `
    <div class="order">
      <div class="order-top">
        <h4><img class="coin-img" src="assets/coin.png" alt="" width="20" height="20"> ${faNumGroup(pack.coins)} سکه</h4>
        <span class="status ${pending ? 'status-pending' : 'status-paid'}"><i></i>${pending ? 'در انتظار پرداخت' : 'پرداخت شد'}</span>
      </div>
      <p class="order-code">کد سفارش: ${o.code} · ${o.userTag}</p>
      ${pending ? `
      <div class="order-actions">
        ${o.currency === 'ton' ? `
          <a class="btn btn-primary" href="https://tonkeeper.com/transfer/${TON_WALLET}?amount=${o.amount}&text=${encodeURIComponent(o.code)}" target="_blank" rel="noopener">پرداخت با تون‌کیپر</a>
          <button class="btn btn-ghost" data-copy-comment="${o.code}">پرداخت با کیف پول تلگرام</button>
        ` : `
          <a class="btn btn-primary" href="${STARS_BOT}" target="_blank" rel="noopener">ادامه‌ی پرداخت در ربات</a>
        `}
      </div>` : ''}
    </div>`;
  }).join('') + `</div>`;
}
document.addEventListener('click', async e => {
  const buy = e.target.closest('[data-pack]');
  if (buy) {
    const pack = PACKS.find(p => p.id === buy.dataset.pack);
    const code = 'KC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    const o = { id: code, pack: pack.id, currency: payMethod, amount: payMethod === 'stars' ? pack.stars : pack.ton, code, userTag: S.userTag, status: 'pending', at: Date.now() };
    S.orders.push(o); save(); haptic.tap();
    renderOrders();
    toast('سفارشت ساخته شد — ' + code);
    if (payMethod === 'ton') {
      window.open(`https://tonkeeper.com/transfer/${TON_WALLET}?amount=${o.amount}&text=${encodeURIComponent(o.code)}`, '_blank');
    } else {
      window.open(STARS_BOT, '_blank');
    }
    return;
  }
  const copy = e.target.closest('[data-copy-comment]');
  if (copy) {
    try { await navigator.clipboard.writeText(copy.dataset.copyComment); toast('کامنت انتقال کپی شد — عیناً بفرست'); }
    catch (err) { toast('کد را دستی کپی کن: ' + copy.dataset.copyComment); }
  }
});
$('#btn-copy-wallet').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(TON_WALLET); toast('آدرس ولت تون کپی شد'); }
  catch (err) { toast('آدرس: ' + TON_WALLET); }
});

/* ---------- Balance sheet (tap balance) ---------- */
$('#btn-balance').addEventListener('click', () => {
  haptic.tap();
  openSheet(`
    <h3>موجودی سکه</h3>
    <p class="sheet-sub">سکه‌ها فقط امتیاز و رکوردند — هیچ‌وقت پول نقد نیستند و بازی همیشه رایگان است.</p>
    <div class="mode-list">
      <button class="mode-btn" data-goto="tasks">
        <div><h4>جایزه‌ی روزانه</h4><p>هر روز یک بلیت + سکه‌ی جایزه</p></div><span class="go">دریافت ←</span>
      </button>
      <button class="mode-btn" data-goto="shop">
        <div><h4>فروشگاه سکه</h4><p>با استارز یا تون — ارزان و مستقیم</p></div><span class="go">خرید ←</span>
      </button>
    </div>`);
});
$('#btn-profile').addEventListener('click', () => {
  haptic.tap();
  const pct = S.played ? Math.round(S.wins / S.played * 100) : 0;
  openSheet(`
    <h3>پروفایل من</h3>
    <p class="sheet-sub">آمار، درصد برد و رتبه‌ی فعلی — ${S.name} · ${S.userTag}</p>
    <div class="stat-band" style="margin-top:var(--sp-4)">
      <div class="stat"><b>${faNum(S.wins)}</b><span>برد</span></div>
      <div class="stat"><b>${faNum(S.played)}</b><span>بازی</span></div>
      <div class="stat"><b>${faNum(pct)}٪</b><span>درصد برد</span></div>
    </div>
    <div class="rank-row current" style="margin-top:var(--sp-3)">
      ${rankGem(rankOf(S.elo))}
      <div><h4>${rankLabel(S.elo)}</h4><p>رتبه‌ی فعلی</p></div>
      <span class="range">ELO ${faNum(S.elo)}</span>
    </div>
    ${S.history.length ? `<div class="reward-list">${S.history.slice(0,5).map(h => `
      <div class="row"><span class="tag">${h.win ? 'برد' : 'باخت'}</span><span>${h.game} · ${h.mode}</span></div>`).join('')}
    </div>` : `<p class="muted small" style="margin-top:var(--sp-4)">هنوز مسابقه‌ای بازی نکرده‌ای. از تب خانه یک بازی انتخاب کن تا تاریخچه‌ات اینجا ساخته شود.</p>`}
  `);
});

/* ---------- Boot ---------- */
function renderAll() {
  renderHeader(); renderGames(); renderChallenge(); renderTasks();
  renderBoard(); renderRanks(); renderBeginner(); renderStats();
  renderPacks(); renderOrders();
}
load();
renderAll();
tickCountdown();
// Autoplay the featured coin video (muted + playsinline already set in markup)
$('#coin-video').play().catch(() => {});
