/* LAUNCH ROOM · Boardroom Wars: The EV Race — Sample Play
   game.js — engine + UI. Classic script (no modules) so it runs from file://.
   URL flags: ?auto=1 (watch mode) · ?speed=10 (timers ÷10) · ?seed=7 · ?co=ather · ?botacc=0.4 */
(function () {
  'use strict';
  var D = window.LR_DATA;
  var QS = {};
  (location.search || '').replace(/^\?/, '').split('&').forEach(function (kv) {
    if (!kv) return; var i = kv.indexOf('=');
    QS[decodeURIComponent(i < 0 ? kv : kv.slice(0, i))] = i < 0 ? '1' : decodeURIComponent(kv.slice(i + 1));
  });
  var SPEED = Math.max(0.1, parseFloat(QS.speed) || 1);
  var AUTO = QS.auto === '1';
  var SEED = QS.seed ? ((parseInt(QS.seed, 10) >>> 0) || 1) : ((Date.now() % 2147483646) + 1);
  var BOTACC = (QS.botacc != null && QS.botacc !== '') ? Math.max(0, Math.min(1, parseFloat(QS.botacc))) : 0.65;
  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rand = mulberry32(SEED);
  var ri = function (n) { return Math.floor(rand() * n); };
  var pick = function (a) { return a[ri(a.length)]; };
  var shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = ri(i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  var range = function (n) { var r = []; for (var i = 0; i < n; i++) r.push(i); return r; };
  var r1 = function (x) { return Math.round(x * 10) / 10; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var fmtEV = function (x) { return '₹' + x.toFixed(1) + ' cr'; };
  var fmtD = function (d) { var a = Math.abs(d); var s = (Math.round(a) === a) ? String(a) : a.toFixed(1); return (d > 0 ? '+' : d < 0 ? '−' : '±') + s; };

  var SEATIDS = ['CEO', 'CTO', 'CMO', 'CFO', 'ALLY'];
  var SEATLABEL = { CEO: 'CEO', CTO: 'CTO', CMO: 'CMO', CFO: 'CFO', ALLY: 'Alliances head' };
  var PTS = { 1: { right: 20, near: 6, wrong: -8 }, 2: { right: 30, partly: 10, wrong: -10 }, 3: { right: 25, partly: 8, wrong: -10 } };
  var MEET = { 1: 'Stage call', 2: 'Route + deals', 3: 'Keep or switch' };
  var HOST = { 1: 'yash', 2: 'nachiket', 3: 'palash' };
  var INV = { LO: 'LI', LI: 'LO', CM: 'MF', MF: 'CM', JV: 'JV' };
  var TLABEL = { LO: 'License out', LI: 'License in', CM: 'Contract manufacture (they make for us)', MF: 'Contract manufacture (we make for them)', JV: 'Joint venture' };
  var TSHORT = { LO: 'LIC', LI: 'LIC', CM: 'MFG', MF: 'MFG', JV: 'JV' };
  var PLUG = { LECCS: 'LECCS', TYPE6: 'Type 6', NEUTRAL: 'Neutral' };
  var PLUG_OWNER = { LECCS: 'ather', TYPE6: 'ultraviolette' };
  var BOARD_T = 40, PRIV_T = 15, BRIEF_T = 8, REVEAL_T = 30, STAND_T = 15;
  function persona(id) { for (var i = 0; i < D.PERSONAS.length; i++) if (D.PERSONAS[i].id === id) return D.PERSONAS[i]; return D.PERSONAS[0]; }
  function tilt(i) { return [-1.6, 1.2, -0.8, 1.8, -1.9, 0.9, -1.2, 1.5][i % 8] + 'deg'; }

  /* ------------------------------------------------------------ state */
  var G = {
    tok: 0, phase: 'title', meeting: 0, t: 0, paused: false, tasks: [], timer: null,
    cos: [], byId: {}, players: [], human: null, hco: null,
    pc: null, choice: null, locked: false,
    deals: [], sent: 0, offers: [], whisperLog: [],
    prevTeam: {}, plugResult: null, battle: null,
    muted: false, interacted: false, boardsTab: 'team', feed: [], errors: 0
  };

  function initWorld() {
    D.COMPANIES.forEach(function (d) {
      var co = { id: d.id, d: d, ledger: [], ev: 100, players: [], plug: d.plug.side || 'NEUTRAL', dec: {}, deals: 0, fitDeals: 0, dmg: 0, board: null };
      G.cos.push(co); G.byId[d.id] = co;
    });
    var names = shuffle(D.BOT_NAMES), ni = 0;
    G.cos.forEach(function (co) {
      SEATIDS.forEach(function (seat) {
        var p = { id: 'p' + G.players.length, name: names[ni++ % names.length], co: co.id, seat: seat, bot: true, pts: 0, log: [], pc: {}, streak: 0, dmg: 0 };
        G.players.push(p); co.players.push(p);
      });
    });
  }
  function seatPlayer(co, seat) { for (var i = 0; i < co.players.length; i++) if (co.players[i].seat === seat) return co.players[i]; return null; }

  /* the ONLY EV writer: every change is a rounded ledger line; EV = 100 + sum */
  function addEV(co, delta, label, tag) {
    delta = r1(delta); if (!delta) return;
    co.ledger.push({ d: delta, l: label, m: tag || '' });
    var s = 0; co.ledger.forEach(function (x) { s += x.d; });
    co.ev = r1(100 + s);
  }
  function addPts(p, pts, label) { pts = Math.round(pts); if (!pts) return; p.pts += pts; p.log.push({ d: pts, l: label }); }

  /* ------------------------------------------------------------ clock (one clock: speed, skip, pause) */
  var lastReal = performance.now();
  setInterval(function () {
    var now = performance.now(); var dt = Math.min(1, (now - lastReal) / 1000); lastReal = now;
    if (G.paused) return;
    safe(function () { step(dt * SPEED); });
  }, 50);
  function step(dt) {
    G.t += dt;
    var list = G.tasks; G.tasks = []; var due = [];
    list.forEach(function (t) { if (t.at <= G.t) due.push(t); else G.tasks.push(t); });
    due.sort(function (a, b) { return a.at - b.at; });
    due.forEach(function (t) { if (t.tok === G.tok) safe(t.fn); });
    if (G.timer) {
      if (G.timer.tok !== G.tok) G.timer = null;
      else {
        G.timer.left -= dt;
        if (G.timer.left <= 0) { var tm = G.timer; G.timer = null; safe(tm.onEnd); }
      }
    }
    updTimer();
  }
  function later(sec, fn) { G.tasks.push({ at: G.t + sec, fn: fn, tok: G.tok }); }
  function setTimer(sec, onEnd) { G.timer = { total: sec, left: sec, onEnd: onEnd, tok: G.tok }; updTimer(); }
  function enter(phase) { G.tok++; G.phase = phase; G.timer = null; G.tasks = []; document.body.setAttribute('data-phase', phase); window.__phase = phase; updHud(); }
  function safe(fn) { try { fn(); } catch (e) { G.errors++; console.error('[LR]', e && e.stack || e); } }

  /* ------------------------------------------------------------ hud / chrome */
  function phaseLabel() {
    var p = G.phase, m = G.meeting;
    var map = { title: 'LOBBY', pick: 'PICK A BOARD', brief: 'M' + m + ' · BRIEF', private: 'M' + m + ' · PRIVATE CALL', board: 'M' + m + ' · BOARD', reveal: 'M' + m + ' · REVEAL', standings: 'STANDINGS', boot: 'FINAL · BOOT', end: 'FINAL · RESULT', podium: 'PODIUM' };
    if (p === 'telegraph' || p === 'answer' || p === 'resolve') return 'FINAL · C' + (G.battle.cycle + 1) + '/6 · ' + p.toUpperCase();
    return map[p] || p.toUpperCase();
  }
  function updHud() {
    var el = $('#hud-phase'); if (el) el.textContent = phaseLabel();
    var co = $('#hud-co');
    if (co) co.innerHTML = G.hco ? ('<b>' + esc(G.hco.d.short) + '</b> ' + fmtEV(G.hco.ev)) : '';
    updTimer();
  }
  function updTimer() {
    var box = $('#hud-timer'), sk = $('#hud-skip'); if (!box) return;
    if (G.timer) {
      box.classList.add('on'); sk.hidden = false;
      var f = Math.max(0, G.timer.left / G.timer.total);
      box.querySelector('i').style.width = (f * 100).toFixed(1) + '%';
      box.querySelector('span').textContent = Math.ceil(Math.max(0, G.timer.left)) + 's';
      box.classList.toggle('low', G.timer.left <= 5);
    } else { box.classList.remove('on'); sk.hidden = true; }
  }
  function render(html) { var m = $('#main'); m.innerHTML = html; try { window.scrollTo(0, 0); } catch (e) { } updHud(); }
  function toast(msg) {
    var box = $('#toasts'); if (!box) return;
    var el = document.createElement('div'); el.className = 'toast mono'; el.textContent = msg; box.appendChild(el);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 3600);
  }
  function pushFeed(msg) { G.feed.unshift(msg); G.feed = G.feed.slice(0, 6); updTicker(); }
  function updTicker() {
    var el = $('#ticker-in'); if (!el) return;
    var quotes = teamRanks().map(function (co) {
      var last = co.ledger.length ? co.ledger[co.ledger.length - 1].d : 0;
      return co.d.short + ' ' + fmtEV(co.ev) + (last > 0 ? ' ▲' : last < 0 ? ' ▼' : '');
    });
    var txt = 'MARKET FEED ▸ ' + quotes.concat(G.feed).concat(['PLUG WAR: LECCS vs TYPE 6', 'FIRST TO MARKET ≠ THE STANDARD']).join('  ·  ') + '  ·  ';
    el.innerHTML = '<span>' + esc(txt) + '</span><span aria-hidden="true">' + esc(txt) + '</span>';
  }
  function flash() { var f = $('#flash'); if (!f) return; f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }

  function scribble(cls) { return '<svg class="scribble ' + (cls || '') + '" viewBox="0 0 220 14" preserveAspectRatio="none" aria-hidden="true"><path d="M3 9 C 40 3, 80 13, 120 7 S 190 3, 217 8"/></svg>'; }
  function scribCircle() { return '<svg class="scrib-circle" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true"><path d="M8 10 C 60 1, 140 0, 193 6 C 200 38, 199 70, 193 94 C 130 100, 60 99, 7 93 C 0 64, 1 32, 12 4"/></svg>'; }
  function scribArrow() { return '<svg class="scrib-arrow" viewBox="0 0 120 40" aria-hidden="true"><path d="M4 30 C 40 6, 80 6, 112 20 M 98 10 L 113 20 L 97 30"/></svg>'; }

  function personaHTML(p, size, state) {
    var back = '';
    if (p.id === 'palash') {
      var f = ['U↑ S↑ ⇒ LO', 'p.305', 'Σ factors', 'TRL 3', 'ΔEV', 'Fig. 10-2', '6 × 4', 'p.306', '√', '%'];
      back = '<div class="formulas" aria-hidden="true">' + f.map(function (t, i) { return '<span style="left:' + ((i * 37) % 90) + '%;top:' + ((i * 53) % 85) + '%;animation-delay:' + (i * 0.7).toFixed(1) + 's">' + t + '</span>'; }).join('') + '</div>';
    }
    return '<div class="persona ' + (size || '') + ' ' + (state || 'idle') + ' p-' + p.id + '" id="head-' + p.id + '" style="--aura:' + p.color + '">' + back +
      '<div class="disc"><span class="aura"></span><span class="mono-l">' + p.mono + '</span></div>' +
      '<div class="p-cap"><b>' + esc(p.title) + '</b><span>' + esc(p.name) + ' · ' + esc(p.topics) + '</span></div></div>';
  }
  function setHead(id, state) { var el = $('#head-' + id); if (!el) return; el.classList.remove('idle', 'attack', 'hit', 'defeated', 'victory'); void el.offsetWidth; el.classList.add(state); }

  /* ------------------------------------------------------------ audio (optional files in audio/) */
  var AUD = {}, want = null;
  function music(name) { want = name; playWant(); }
  function playWant() {
    Object.keys(AUD).forEach(function (k) { var a = AUD[k]; if (a && k !== want) { try { a.pause(); } catch (e) { } } });
    if (!want || !G.interacted || G.muted) return;
    var a = AUD[want]; if (a === false) return;
    if (!a) {
      var nm = want; a = new Audio('audio/' + nm + '.mp3'); a.loop = (nm === 'lobby' || nm === 'meeting' || nm === 'boss'); a.volume = 0.5;
      a.addEventListener('error', function () { AUD[nm] = false; }); AUD[nm] = a;
    }
    try { var p = a.play(); if (p && p.catch) p.catch(function () { }); } catch (e) { }
  }

  /* ------------------------------------------------------------ confetti */
  function confetti(n) {
    if (REDUCED) return;
    var cv = $('#fx'); if (!cv || !cv.getContext) return; var ctx = cv.getContext('2d');
    var W = cv.width = window.innerWidth, H = cv.height = window.innerHeight;
    var cols = ['#C9A227', '#E6C76E', '#F3EFE6', '#A39E93'];
    var ps = range(n || 160).map(function () { return { x: W / 2 + (Math.random() - 0.5) * W * 0.4, y: H * 0.35, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 15 - 4, s: 5 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: cols[Math.floor(Math.random() * 4)] }; });
    var t0 = performance.now(); cv.classList.add('on');
    (function frame(now) {
      var el = now - t0; ctx.clearRect(0, 0, W, H);
      ps.forEach(function (p) { p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
      if (el < 3200) requestAnimationFrame(frame); else { ctx.clearRect(0, 0, W, H); cv.classList.remove('on'); }
    })(t0);
  }

  /* ------------------------------------------------------------ meeting model */
  function md(co, m) {
    var d = co.d;
    if (m === 1) return { q: d.m1.q, options: D.STAGES, key: d.m1.key, part: d.m1.near, decider: d.m1.decider, factor: null, why: d.m1.why, real: d.m1.real };
    if (m === 2) return { q: d.m2.q, options: d.m2.options, key: d.m2.key, part: d.m2.partial, decider: d.m2.decider, factor: d.m2.factor, why: d.m2.why, real: d.m2.real };
    return { q: 'WHAT-IF: ' + d.m3.whatif + ' Keep or switch?', options: d.m3.options, key: d.m3.key, part: d.m3.partial, decider: d.m3.decider, factor: d.m3.factor, why: d.m3.why, real: d.m3.next ? ('In reality, next: ' + d.m3.next) : 'What-if only — no real event; the factor decides.' };
  }
  function grade(co, m, opt) { var x = md(co, m); if (opt === x.key) return 'right'; if (x.part != null && opt === x.part) return m === 1 ? 'near' : 'partly'; return 'wrong'; }
  function seatStance(co, seat, m) { if (m === 1) return D.STAGE_SHORT[co.d.m1.votes[seat]]; if (m === 2) return co.d.m2.stances[seat]; return co.d.m3.cards[seat].s; }
  function seatText(co, seat, m) { return m === 3 ? co.d.m3.cards[seat].t : co.d.seats[seat]; }
  function seatReading(co, seat, m) { if (m === 1) return 'Milestone · votes ' + D.STAGES[co.d.m1.votes[seat]]; if (m === 2) return co.d.m2.readings[seat]; return 'What-if reading · ' + (co.d.m3.cards[seat].s === 'KEEP' ? 'stay the course' : 'change course'); }
  function optStance(co, m, opt) { if (m === 1) return D.STAGE_SHORT[opt]; if (m === 2) return opt === co.d.m2.keepOpt ? 'KEEP' : 'SHARE'; return opt === 0 ? 'KEEP' : 'SWITCH'; }
  function stanceKeys(m) { return m === 1 ? D.STAGE_SHORT.slice() : m === 2 ? ['KEEP', 'SHARE'] : ['KEEP', 'SWITCH']; }
  function botBoardChoice(co, m) {
    var x = md(co, m), r = rand();
    if (r < 0.6) return x.key;
    if (r < 0.85 && x.part != null) return x.part;
    var poor = range(x.options.length).filter(function (i) { return i !== x.key && i !== x.part; });
    return pick(poor);
  }
  function allTabled(co) { return D.SEATS.every(function (s) { return co.board.tabled[s.id]; }); }
  function votes(co) {
    var m = G.meeting, cnt = {};
    stanceKeys(m).forEach(function (k) { cnt[k] = 0; });
    var ceo = seatPlayer(co, 'CEO'); var pc = ceo.pc[m];
    if (pc) cnt[optStance(co, m, pc.opt)]++;
    D.SEATS.forEach(function (s) { if (co.board.tabled[s.id]) cnt[seatStance(co, s.id, m)]++; });
    return cnt;
  }
  function splitText(co) { var c = votes(co); var ks = Object.keys(c).filter(function (k) { return G.meeting !== 1 || c[k] > 0; }); return ks.map(function (k) { return k + ' ' + c[k]; }).join(' · ') || '—'; }
  function plurality(co) {
    var m = G.meeting, x = md(co, m), cnt = range(x.options.length).map(function () { return 0; });
    co.players.forEach(function (p) { if (p.pc[m]) cnt[p.pc[m].opt]++; });
    var best = 0; cnt.forEach(function (n, i) { if (n > cnt[best]) best = i; });
    return best;
  }

  /* ------------------------------------------------------------ actions */
  var ACT = {};
  document.addEventListener('click', function (e) {
    if (e.isTrusted && !G.interacted) { G.interacted = true; playWant(); }
    if (e.target && e.target.id === 'overlay') { closeOverlay(); return; }
    var el = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!el || el.disabled) return;
    var fn = ACT[el.getAttribute('data-act')];
    if (fn) safe(function () { fn(el.getAttribute('data-arg'), el); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeOverlay(); });
  function autoClick(sel) { var el = document.querySelector(sel); if (el && !el.disabled) { el.click(); return true; } return false; }

  ACT.skip = function () { if (G.timer) G.timer.left = 0; };
  ACT.pause = function (a, el) { G.paused = !G.paused; lastReal = performance.now(); el.textContent = G.paused ? 'Resume ▸' : '❚❚'; el.setAttribute('aria-pressed', G.paused ? 'true' : 'false'); document.body.classList.toggle('is-paused', G.paused); };
  ACT.mute = function (a, el) { G.muted = !G.muted; el.textContent = G.muted ? '♪ off' : '♪ on'; el.setAttribute('aria-pressed', G.muted ? 'true' : 'false'); if (G.muted) Object.keys(AUD).forEach(function (k) { if (AUD[k]) AUD[k].pause(); }); else playWant(); };
  ACT.boards = function () { openBoards(G.boardsTab); };
  ACT.tab = function (a) { openBoards(a); };
  ACT['close-ov'] = function () { closeOverlay(); };
  ACT.cont = function () { if (G.timer) G.timer.left = 0; };
  ACT.again = function () { location.reload(); };

  /* ------------------------------------------------------------ title + pick */
  function howtoHTML() {
    return '<ol class="howto">' +
      '<li><b>Pick a company.</b> You are its CEO; four bot executives sit on your board.</li>' +
      '<li><b>Each meeting:</b> read the brief, make a private call, hear your board’s seat cards, then lock the decision.</li>' +
      '<li><b>M1</b> stage of development · <b>M2</b> exploitation route + deals + plug war · <b>M3</b> a what-if: keep or switch.</li>' +
      '<li><b>Right calls grow EV</b> (₹ cr). The deciding card shows which of Ford’s factors settled it.</li>' +
      '<li><b>Final battle:</b> answer fast to bring down The Closed Plug. Highest EV is Market Leader.</li></ol>';
  }
  function scoringHTML() {
    return '<div class="scoring"><div class="kicker mono">HOW SCORING WORKS</div><dl>' + D.SCORING.map(function (r) { return '<div><dt class="mono">' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('') + '</dl></div>';
  }
  function phaseTitle() {
    enter('title'); music('lobby');
    render('<section class="screen title-screen">' +
      '<div class="title-hero frame"><div class="kicker mono">LAUNCH ROOM · SAMPLE PLAY · SOLO</div>' +
      '<h1 class="display">Boardroom Wars<span class="h1-sub">The EV Race</span></h1>' + scribble('big') +
      '<p class="pitch">Eight Indian EV boards. Three board meetings. One closed plug to bring down. Call the stage, pick the route, survive the what-if — then fight the incumbent with the whole class.</p>' +
      howtoHTML() +
      '<div class="title-cta"><button class="btn gold big" data-act="start">Start ▸</button><span class="mono muted">40 players · 39 are bots with made-up names</span></div></div>' +
      '<div class="title-side"><div class="kicker mono">THE CLOSED PLUG · FOUR HEADS</div><div class="heads-grid">' + D.PERSONAS.map(function (p) { return personaHTML(p, 'md'); }).join('') + '</div>' +
      scoringHTML() + '</div></section>');
    updTicker();
    if (AUTO) setTimeout(function () { autoClick('[data-act="start"]'); }, 3000);
  }
  ACT.start = function () { if (G.phase === 'title') phasePick(); };
  function phasePick() {
    enter('pick');
    render('<section class="screen pick-screen"><div class="kicker mono">STEP 1 · CHOOSE YOUR BOARD</div><h2 class="display">Which company will you run?' + scribble() + '</h2>' +
      '<p class="muted">Bots take the other seven boards. Mirror companies play the other side of a real deal.</p>' +
      '<div class="pick-grid">' + G.cos.map(function (co, i) {
        var d = co.d;
        return '<button class="pick-card sticker tape" style="--tilt:' + tilt(i) + '" data-act="pick" data-arg="' + co.id + '">' +
          '<span class="pc-top mono">#' + (i + 1) + ' · ' + esc(d.when.toUpperCase()) + (d.verify ? ' <em class="verify">being verified</em>' : '') + '</span>' +
          '<span class="pc-name display">' + esc(d.name) + '</span>' +
          '<span class="pc-card">' + esc(d.card) + '</span>' +
          '<span class="chips">' + plugChip(co) + (d.mirrorOf ? '<span class="chip mono">MIRROR · ' + esc(d.mirrorOf.toUpperCase()) + '</span>' : '') + '</span></button>';
      }).join('') + '</div></section>');
    if (AUTO) { var autoId = QS.co && G.byId[QS.co] ? QS.co : pick(G.cos).id; setTimeout(function () { autoClick('[data-act="pick"][data-arg="' + autoId + '"]'); }, 2600); }
  }
  function plugChip(co) {
    var p = co.d.plug;
    if (p.role === 'owner') return '<span class="chip gold mono">' + PLUG[p.side].toUpperCase() + ' OWNER</span>';
    if (p.role === 'chooser') return '<span class="chip mono">PLUG · YOUR CALL</span>';
    return '<span class="chip mono">PLUG · NEUTRAL' + (p.note ? ' (' + p.note.toUpperCase() + ')' : '') + '</span>';
  }
  ACT.pick = function (id) {
    if (G.phase !== 'pick' || !G.byId[id]) return;
    G.hco = G.byId[id]; G.human = seatPlayer(G.hco, 'CEO'); G.human.bot = false; G.human.name = 'You';
    toast('You are CEO of ' + G.hco.d.name);
    startMeeting(1);
  };

  /* ------------------------------------------------------------ meeting flow */
  function startMeeting(m) {
    G.meeting = m; G.pc = null; G.choice = null; G.locked = false;
    G.cos.forEach(function (co) {
      var x = md(co, m);
      co.board = { tabled: {}, locked: false, opt: null, lockT: null, missed: false, plan: botBoardChoice(co, m), tabledBy: 0 };
      co.players.forEach(function (p) {
        if (!p.bot) return;
        var ok = rand() < 0.7;
        var opt = ok ? x.key : pick(range(x.options.length).filter(function (i) { return i !== x.key; }));
        p.pc[m] = { opt: opt, t: 2 + rand() * 11 };
      });
    });
    if (m === 2) setupM2();
    phaseBrief();
  }
  function meetHead(step) {
    var m = G.meeting, p = persona(HOST[m]);
    var steps = ['brief', 'private', 'board', 'reveal'], names = { brief: 'Brief', private: 'Private call', board: 'Board', reveal: 'Reveal' };
    var si = steps.indexOf(step);
    return '<div class="meet-head">' + personaHTML(p, 'sm') +
      '<div class="mh-txt"><div class="kicker mono">MEETING ' + m + ' OF 3 · HOSTED BY ' + esc(p.title.toUpperCase()) + '</div>' +
      '<h2 class="display">' + MEET[m] + scribble() + '</h2></div>' +
      '<ol class="steps mono">' + steps.map(function (s, i) { return '<li class="' + (i === si ? 'on' : i < si ? 'done' : '') + '">' + names[s] + '</li>'; }).join('') + '</ol></div>';
  }
  function coCardHTML(co, t) {
    var d = co.d;
    return '<article class="co-card sticker tape" style="--tilt:' + (t || '-1.2deg') + '">' +
      '<div class="cc-top mono"><span>' + esc(d.when.toUpperCase()) + '</span>' + (d.verify ? '<span class="verify">being verified</span>' : '') + '</div>' +
      '<h3 class="display">' + esc(d.name) + '</h3>' +
      (d.mirrorOf ? '<div class="chip mono">MIRROR OF ' + esc(d.mirrorOf.toUpperCase()) + '</div>' : '') +
      '<p>' + esc(d.card) + '</p><div class="chips">' + plugChip(co) + '<span class="chip mono">EV ' + fmtEV(co.ev) + '</span></div></article>';
  }
  function whatifHTML(co) { return '<div class="whatif"><span class="wi-tag mono">WHAT-IF</span><span class="wi-txt">' + esc(co.d.m3.whatif) + '</span><span class="wi-f mono">FACTOR TO WATCH ▸ ' + esc(D.FACTOR_LABEL[co.d.m3.factor]) + '</span></div>'; }

  function phaseBrief() {
    enter('brief'); music('meeting');
    var co = G.hco, m = G.meeting, x = md(co, m);
    render('<section class="screen meeting">' + meetHead('brief') +
      '<div class="brief-grid">' + coCardHTML(co) +
      '<div class="brief-q frame"><div class="kicker mono">THE BOARD MUST DECIDE</div>' +
      (m === 3 ? whatifHTML(co) : '') +
      '<h3 class="q">' + esc(m === 3 ? 'Keep the current route or switch?' : x.q) + '</h3>' +
      '<ul class="opt-preview">' + x.options.map(function (o, i) { return '<li><span class="L mono">' + 'ABCD'[i] + '</span>' + esc(o) + '</li>'; }).join('') + '</ul>' +
      (m === 2 ? '<p class="mono muted small">Deal window opens in the board phase: term sheets, whispers, plug war.</p>' : '') +
      '</div></div></section>');
    setTimer(BRIEF_T, phasePrivate);
  }

  function phasePrivate() {
    enter('private');
    var co = G.hco, m = G.meeting, x = md(co, m);
    render('<section class="screen meeting">' + meetHead('private') +
      '<div class="private frame"><div class="kicker mono">PRIVATE CALL · ANSWER ALONE · YOUR BOARD CAN’T SEE THIS</div>' +
      (m === 3 ? whatifHTML(co) : '') +
      '<h3 class="q">' + esc(x.q) + '</h3>' +
      '<div class="opts">' + x.options.map(function (o, i) { return '<button class="opt" data-act="private" data-arg="' + i + '"><span class="L mono">' + 'ABCD'[i] + '</span>' + esc(o) + '</button>'; }).join('') + '</div>' +
      '<div class="mono muted" id="private-status">Right + fast = up to 150 points on the class board.</div></div></section>');
    setTimer(PRIV_T, endPrivate);
    if (AUTO) later(1 + rand() * 4, function () {
      var opt = rand() < 0.7 ? x.key : pick(range(x.options.length).filter(function (i) { return i !== x.key; }));
      autoClick('[data-act="private"][data-arg="' + opt + '"]');
    });
  }
  ACT.private = function (a, el) {
    if (G.phase !== 'private' || G.pc) return;
    var opt = +a, left = G.timer ? G.timer.left : 0;
    G.pc = { opt: opt, t: PRIV_T - left }; G.human.pc[G.meeting] = G.pc;
    $$('[data-act="private"]').forEach(function (b) { b.disabled = true; });
    el.classList.add('sel');
    var st = $('#private-status'); if (st) st.textContent = 'Locked privately ✓ — the board convenes…';
    if (G.timer && G.timer.left > 1.2) G.timer.left = 1.2;
  };
  function endPrivate() {
    var m = G.meeting;
    G.cos.forEach(function (co) {
      var key = md(co, m).key;
      co.players.forEach(function (p) {
        var pc = p.pc[m]; if (!pc) return;
        if (pc.opt === key) addPts(p, 100 + 50 * Math.max(0, (PRIV_T - pc.t) / PRIV_T), 'M' + m + ' private call');
      });
    });
    phaseBoard();
  }

  function seatCardHTML(co, seat, m, tabled, isDecider, i) {
    var p = seatPlayer(co, seat);
    if (!tabled) return '<div class="seat empty" id="seat-' + seat + '"><div class="seat-top"><span class="seat-role mono">' + SEATLABEL[seat] + ' · ' + esc(p.name) + '</span></div><div class="seat-wait mono">thinking<span class="dots"></span></div></div>';
    var st = seatStance(co, seat, m);
    return '<div class="seat sticker in ' + (isDecider ? 'decider' : '') + '" id="seat-' + seat + '" style="--tilt:' + tilt(i + 2) + '">' +
      '<div class="seat-top"><span class="seat-role mono">' + SEATLABEL[seat] + ' · ' + esc(p.name) + '</span><span class="stance mono st-' + st + '">' + st + '</span></div>' +
      '<p>' + esc(seatText(co, seat, m)) + '</p><div class="reading mono">' + esc(seatReading(co, seat, m)) + '</div>' +
      (isDecider ? '<div class="dec-tag mono">DECIDING CARD</div>' + scribCircle() : '') + '</div>';
  }
  function phaseBoard() {
    enter('board');
    var co = G.hco, m = G.meeting, x = md(co, m);
    G.choice = G.pc ? G.pc.opt : null;
    render('<section class="screen meeting">' + meetHead('board') +
      '<div class="board-grid"><div class="your-board">' +
      '<div class="kicker mono">YOUR BOARD · ' + esc(co.d.name.toUpperCase()) + ' · SEAT CARDS</div>' +
      (m === 3 ? whatifHTML(co) : '') +
      '<div class="seats">' + D.SEATS.map(function (s, i) { return seatCardHTML(co, s.id, m, false, false, i); }).join('') + '</div>' +
      '<div class="ceo-panel frame"><div class="kicker mono">CEO DECISION · SPLIT <span id="split-you">—</span></div>' +
      '<div class="opts compact">' + x.options.map(function (o, i) { return '<button class="opt ' + (G.choice === i ? 'sel' : '') + '" data-act="choose" data-arg="' + i + '"><span class="L mono">' + 'ABCD'[i] + '</span>' + esc(o) + '</button>'; }).join('') + '</div>' +
      '<div class="lock-row"><button id="lock-btn" class="btn gold" data-act="lock" disabled>LOCK AS CEO ▸</button><span id="lock-hint" class="mono muted">Lock opens when all four cards are tabled.</span></div></div>' +
      '</div><aside class="live frame"><div class="kicker mono">ALL BOARDS · LIVE SPLIT</div><ul id="live-list">' +
      G.cos.map(function (c) { return '<li class="live-row ' + (c === G.hco ? 'you' : '') + '" id="live-' + c.id + '"></li>'; }).join('') +
      '</ul><p class="mono muted small">' + (m === 1 ? 'Stage votes: BR · AR · DEV · TE' : m === 2 ? 'KEEP = keep it in-house / build our own · SHARE = partner, licence, contract' : 'KEEP the route · SWITCH it') + '</p></aside>' +
      (m === 2 ? dealRoomHTML() : '') + '</div></section>');
    G.cos.forEach(function (c) {
      var t = 0;
      D.SEATS.forEach(function (s) { t += 0.5 + rand() * 3.5; (function (seat, at) { later(at, function () { tableCard(c, seat); }); })(s.id, t); });
      c.board.tabledBy = t;
      if (c !== G.hco) { var lockAt = Math.min(BOARD_T - 2, t + 1 + rand() * 9); later(lockAt, function () { botLock(c); }); }
    });
    setTimer(BOARD_T, boardTimeout);
    updateLive();
    if (m === 2) m2BoardStart();
    if (AUTO) later(co.board.tabledBy + 1 + rand() * 3, function () {
      var opt = rand() < 0.75 ? x.key : pick(range(x.options.length));
      autoClick('[data-act="choose"][data-arg="' + opt + '"]');
      later(0.6, function () { autoClick('#lock-btn'); });
    });
  }
  function tableCard(co, seat) {
    co.board.tabled[seat] = true;
    if (co === G.hco) {
      var el = $('#seat-' + seat), i = D.SEATS.map(function (s) { return s.id; }).indexOf(seat);
      if (el) el.outerHTML = seatCardHTML(co, seat, G.meeting, true, false, i);
      if (allTabled(co)) updLock();
    }
    updateLive(co);
  }
  function liveInner(c) {
    var v = votes(c), keys = Object.keys(v);
    return '<span class="lr-nm mono">' + esc(c.d.short) + '</span><span class="meter">' + keys.map(function (k, i) { return '<i class="seg seg' + (keys.length === 2 ? (i ? 'b' : 'a') : i) + '" style="width:' + (v[k] / 5 * 100) + '%"></i>'; }).join('') + '</span>' +
      '<span class="lr-split mono">' + esc(splitText(c)) + '</span><span class="lr-lk mono ' + (c.board.locked ? 'on' : '') + '">' + (c.board.locked ? 'LOCKED' : Object.keys(c.board.tabled).length + '/4') + '</span>';
  }
  function updateLive(c) {
    (c ? [c] : G.cos).forEach(function (x) { var el = $('#live-' + x.id); if (el) el.innerHTML = liveInner(x); });
    var s = $('#split-you'); if (s && G.hco) s.textContent = splitText(G.hco);
  }
  function updLock() {
    var b = $('#lock-btn'), h = $('#lock-hint'); if (!b) return;
    var ready = allTabled(G.hco) && G.choice != null && !G.locked;
    b.disabled = !ready;
    if (h) h.textContent = !allTabled(G.hco) ? 'Lock opens when all four cards are tabled.' : G.choice == null ? 'Pick an option, then lock.' : 'Ready. Early locks earn up to +3 speed.';
  }
  ACT.choose = function (a) {
    if (G.phase !== 'board' || G.locked) return;
    G.choice = +a;
    $$('[data-act="choose"]').forEach(function (b) { b.classList.toggle('sel', +b.getAttribute('data-arg') === G.choice); });
    updLock();
  };
  ACT.lock = function () { if (G.phase !== 'board' || G.locked || G.choice == null || !allTabled(G.hco)) return; humanLock(G.choice, false); };
  function botLock(c) {
    if (c.board.locked) return;
    c.board.locked = true; c.board.opt = c.board.plan; c.board.lockT = BOARD_T - (G.timer ? G.timer.left : 0);
    updateLive(c);
  }
  function humanLock(opt, missed) {
    if (G.locked) return;
    G.locked = true;
    var b = G.hco.board; b.locked = true; b.opt = opt; b.missed = missed; b.lockT = BOARD_T - (G.timer ? Math.max(0, G.timer.left) : 0);
    G.cos.forEach(function (c) { if (!c.board.locked) botLock(c); });
    if (G.meeting === 2) resolvePendingDeals();
    resolveMeeting();
    phaseReveal();
  }
  function boardTimeout() { if (!G.locked) { toast('Time! The most-suggested option locks (−5 missed window).'); humanLock(plurality(G.hco), true); } }

  /* ------------------------------------------------------------ M2: deals, whispers, plug */
  function needOf(co, T, other) { return co.d.fits[T].indexOf(other.id) >= 0; }
  function hasDeal(a, b) { return G.deals.some(function (d) { return d.status !== 'declined' && ((d.a === a.id && d.b === b.id) || (d.a === b.id && d.b === a.id)); }); }
  function dealCount(c) { return G.deals.filter(function (d) { return d.status === 'signed' && (d.a === c.id || d.b === c.id); }).length; }
  function botPlug(c) {
    var p = c.d.plug, r = rand();
    if (p.role === 'owner') return p.side;
    if (p.role === 'chooser') return r < 0.7 ? p.lean : r < 0.9 ? (p.lean === 'LECCS' ? 'TYPE6' : 'LECCS') : 'NEUTRAL';
    return r < 0.55 ? 'NEUTRAL' : (r < 0.85 ? 'LECCS' : 'TYPE6');
  }
  function setupM2() {
    G.offers = []; G.sent = 0; G.whisperLog = [];
    G.cos.forEach(function (c) {
      if (c === G.hco) { var p = c.d.plug; c.plug = p.role === 'owner' ? p.side : (p.lean || 'NEUTRAL'); return; }
      c.plug = botPlug(c);
    });
    var bots = shuffle(G.cos.filter(function (c) { return c !== G.hco; }));
    bots.forEach(function (a) {
      if (dealCount(a) >= 2 || rand() > 0.6) return;
      var opts = [];
      ['LO', 'LI', 'CM', 'MF', 'JV'].forEach(function (T) {
        a.d.fits[T].forEach(function (bid) { var b = G.byId[bid]; if (b && b !== G.hco && b !== a && dealCount(b) < 2 && !hasDeal(a, b)) opts.push({ T: T, b: b }); });
      });
      var o;
      if (opts.length && rand() < 0.85) o = pick(opts);
      else { var bs = bots.filter(function (x) { return x !== a && !hasDeal(a, x); }); if (!bs.length) return; o = { T: pick(['LO', 'LI', 'CM', 'JV']), b: pick(bs) }; }
      var acceptP = needOf(o.b, INV[o.T], a) ? 0.85 : 0.15;
      if (rand() < acceptP) G.deals.push({ a: a.id, b: o.b.id, T: o.T, fee: pick(['Low', 'Fair', 'High']), status: 'signed', by: 'bot', showAt: 3 + rand() * 24 });
    });
  }
  function dealText(d, from) {
    var a = G.byId[d.a], b = G.byId[d.b];
    return (from === 'a' ? '→ ' + b.d.short : a.d.short + ' → you') + ' · ' + TLABEL[d.T] + ' · fee ' + d.fee;
  }
  function dealRoomHTML() {
    var others = G.cos.filter(function (c) { return c !== G.hco; });
    var owner = G.hco.d.plug.role === 'owner';
    return '<section class="deal-room frame"><div class="kicker mono">DEAL WINDOW · MEETING 2</div><div class="dr-grid">' +
      '<div class="dr-col"><div class="dr-h mono">TERM SHEETS · <span id="ts-left">2</span> LEFT</div>' +
      '<label class="fld mono">TO<select id="ts-to">' + others.map(function (c) { return '<option value="' + c.id + '">' + esc(c.d.name) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fld mono">TYPE<select id="ts-type"><option>License out</option><option>License in</option><option>Contract manufacture</option><option>Joint venture</option></select></label>' +
      '<label class="fld mono">FEE<select id="ts-fee"><option>Low</option><option selected>Fair</option><option>High</option></select></label>' +
      '<button class="btn" data-act="send-ts" id="ts-send">Send term sheet ▸</button><ul class="mini" id="ts-list"></ul></div>' +
      '<div class="dr-col"><div class="dr-h mono">INBOX</div><ul class="mini" id="inbox"><li class="muted">No offers yet…</li></ul></div>' +
      '<div class="dr-col"><div class="dr-h mono">WHISPER WHEEL</div><label class="fld mono">TO<select id="wh-to">' + others.map(function (c) { return '<option value="' + c.id + '">' + esc(c.d.name) + '</option>'; }).join('') + '</select></label>' +
      '<div class="wheel">' + D.WHISPERS.map(function (w, i) { return '<button class="wh" style="--i:' + i + '" data-act="whisper" data-arg="' + i + '">' + esc(w) + '</button>'; }).join('') + '</div><ul class="mini" id="wh-feed"></ul></div>' +
      '<div class="dr-col"><div class="dr-h mono">PLUG WAR · BACK A PLUG</div><div class="plug-btns">' + ['LECCS', 'TYPE6', 'NEUTRAL'].map(function (k) { return '<button class="opt plug ' + (G.hco.plug === k ? 'sel' : '') + '" data-act="plug" data-arg="' + k + '" ' + (owner ? 'disabled' : '') + '>' + PLUG[k] + '</button>'; }).join('') + '</div>' +
      '<p class="mono muted small" id="plug-note">' + (owner ? 'You own ' + PLUG[G.hco.plug] + ' — your side is fixed.' : 'Ather owns LECCS · Ultraviolette owns Type 6. More backers wins at the M3 reveal.') + '</p></div>' +
      '</div></section>';
  }
  function m2BoardStart() {
    var h = G.hco;
    G.deals.forEach(function (d) { if (d.by === 'bot') later(d.showAt, function () { pushFeed('DEAL SIGNED: ' + G.byId[d.a].d.short + ' × ' + G.byId[d.b].d.short + ' (' + TSHORT[d.T] + ')'); }); });
    var cands = [];
    G.cos.forEach(function (b) {
      if (b === h) return;
      ['LO', 'LI', 'CM', 'MF', 'JV'].forEach(function (T) { if (needOf(b, T, h) && needOf(h, INV[T], b)) cands.push({ b: b, T: T }); });
    });
    cands = shuffle(cands); var chosen = [], seen = {};
    cands.forEach(function (c) { if (chosen.length < (rand() < 0.5 ? 1 : 2) && !seen[c.b.id]) { chosen.push(c); seen[c.b.id] = 1; } });
    if (chosen.length < 2 && rand() < 0.6) {
      var mis = G.cos.filter(function (b) { return b !== h && !seen[b.id]; });
      if (mis.length) { var b = pick(mis); var T = pick(['LO', 'LI', 'JV', 'CM']); if (!needOf(h, INV[T], b)) chosen.push({ b: b, T: T }); }
    }
    chosen.forEach(function (c, i) { later(4 + i * 7 + rand() * 4, function () { receiveOffer(c.b, c.T); }); });
    later(6 + rand() * 10, function () { var b = pick(G.cos.filter(function (x) { return x !== h; })); var line = pick(['Deal?', 'Seeking a JV partner', 'Our standing is high', 'Back our plug?', 'We need cells']); logWhisper(b.d.short + ' → you: ' + line); });
    if (AUTO) {
      later(2 + rand() * 2, function () {
        var opts = []; ['LO', 'LI', 'CM', 'JV'].forEach(function (T) { var TT = T === 'CM' && h.d.fits.MF.length ? 'MF' : T; h.d.fits[TT].forEach(function (id) { opts.push({ T: T, id: id }); }); });
        var o = opts.length && rand() < 0.75 ? pick(opts) : { T: pick(['LO', 'LI', 'CM', 'JV']), id: pick(G.cos.filter(function (x) { return x !== h; })).id };
        var lab = { LO: 'License out', LI: 'License in', CM: 'Contract manufacture', JV: 'Joint venture' }[o.T];
        var s1 = $('#ts-to'), s2 = $('#ts-type'); if (s1) s1.value = o.id; if (s2) s2.value = lab;
        autoClick('[data-act="send-ts"]');
      });
      later(3 + rand() * 3, function () { autoClick('[data-act="whisper"][data-arg="' + ri(D.WHISPERS.length) + '"]'); });
      if (h.d.plug.role !== 'owner') later(1.5 + rand() * 2, function () { autoClick('[data-act="plug"][data-arg="' + (rand() < 0.7 ? 'LECCS' : pick(['TYPE6', 'NEUTRAL'])) + '"]'); });
    }
  }
  function receiveOffer(b, T) {
    if (G.phase !== 'board' || G.locked) return;
    var o = { id: 'o' + G.offers.length, a: b.id, b: G.hco.id, T: T, fee: pick(['Low', 'Fair', 'High']), status: 'open' };
    G.offers.push(o); renderInbox(); toast('Term sheet from ' + b.d.name);
    if (AUTO) later(1.5 + rand() * 2, function () { autoClick('[data-act="' + (rand() < 0.7 ? 'offer-yes' : 'offer-no') + '"][data-arg="' + o.id + '"]'); });
  }
  function offerById(id) { for (var i = 0; i < G.offers.length; i++) if (G.offers[i].id === id) return G.offers[i]; return null; }
  function renderInbox() {
    var el = $('#inbox'); if (!el) return;
    if (!G.offers.length) { el.innerHTML = '<li class="muted">No offers yet…</li>'; return; }
    el.innerHTML = G.offers.map(function (o) {
      var a = G.byId[o.a];
      return '<li><span>' + esc(a.d.short) + ' offers: ' + esc(TLABEL[o.T]) + ' (from their side) · fee ' + o.fee + '</span>' +
        (o.status === 'open' ? '<span class="row-btns"><button class="btn sm gold" data-act="offer-yes" data-arg="' + o.id + '">Accept</button><button class="btn sm ghost" data-act="offer-no" data-arg="' + o.id + '">Decline</button></span>' : '<b class="mono">' + (o.status === 'signed' ? 'SIGNED ✓' : 'DECLINED') + '</b>') + '</li>';
    }).join('');
  }
  ACT['offer-yes'] = function (id) {
    var o = offerById(id); if (!o || o.status !== 'open' || G.locked) return;
    o.status = 'signed'; G.deals.push({ a: o.a, b: o.b, T: o.T, fee: o.fee, status: 'signed', by: 'bot-human' });
    pushFeed('DEAL SIGNED: ' + G.byId[o.a].d.short + ' × ' + G.hco.d.short); renderInbox();
  };
  ACT['offer-no'] = function (id) { var o = offerById(id); if (!o || o.status !== 'open') return; o.status = 'declined'; renderInbox(); };
  ACT['send-ts'] = function () {
    if (G.phase !== 'board' || G.locked || G.sent >= 2) return;
    var to = G.byId[$('#ts-to').value], typ = $('#ts-type').value, fee = $('#ts-fee').value;
    var T = { 'License out': 'LO', 'License in': 'LI', 'Joint venture': 'JV' }[typ] || (G.hco.d.fits.MF.length ? 'MF' : 'CM');
    var d = { a: G.hco.id, b: to.id, T: T, fee: fee, status: 'pending', by: 'you' };
    G.deals.push(d); G.sent++;
    var left = $('#ts-left'); if (left) left.textContent = String(2 - G.sent);
    if (G.sent >= 2) { var sb = $('#ts-send'); if (sb) sb.disabled = true; }
    renderSent();
    later(3 + rand() * 5, function () { botRespond(d); });
  };
  function botRespond(d) {
    if (d.status !== 'pending') return;
    var b = G.byId[d.b], a = G.byId[d.a], T = INV[d.T];
    var p = needOf(b, T, a) ? 0.85 : 0.15;
    if (T === 'LI' || T === 'CM') p += d.fee === 'High' ? -0.2 : d.fee === 'Low' ? 0.1 : 0;
    if (T === 'LO' || T === 'MF') p += d.fee === 'Low' ? -0.2 : d.fee === 'High' ? 0.1 : 0;
    d.status = rand() < p ? 'signed' : 'declined';
    if (d.status === 'signed') { pushFeed('DEAL SIGNED: ' + a.d.short + ' × ' + b.d.short); toast(b.d.name + ' accepted your term sheet'); }
    else toast(b.d.name + ' declined your term sheet');
    renderSent();
  }
  function renderSent() {
    var el = $('#ts-list'); if (!el) return;
    el.innerHTML = G.deals.filter(function (d) { return d.by === 'you'; }).map(function (d) {
      return '<li><span>' + esc(dealText(d, 'a')) + '</span><b class="mono">' + (d.status === 'pending' ? 'pending…' : d.status === 'signed' ? 'ACCEPTED ✓' : 'DECLINED') + '</b></li>';
    }).join('');
  }
  function resolvePendingDeals() { G.deals.forEach(function (d) { if (d.status === 'pending') botRespond(d); }); G.offers.forEach(function (o) { if (o.status === 'open') o.status = 'declined'; }); }
  function leader(except) { var r = teamRanks().filter(function (c) { return except.indexOf(c) < 0; }); return r[0]; }
  ACT.whisper = function (a) {
    if (G.phase !== 'board' || G.locked) return;
    var to = G.byId[$('#wh-to').value], line = D.WHISPERS[+a];
    if (line.indexOf('[Company]') >= 0) line = line.replace('[Company]', leader([G.hco, to]).d.short);
    logWhisper('you → ' + to.d.short + ': ' + line);
    later(1 + rand() * 2, function () { logWhisper(to.d.short + ' → you: ' + whisperReply(to, +a)); });
  };
  function whisperReply(b, i) {
    var h = G.hco, anyFit = ['LO', 'LI', 'CM', 'MF', 'JV'].some(function (T) { return needOf(b, T, h); });
    switch (i) {
      case 0: return anyFit ? 'Deal?' : 'Not interested';
      case 1: return b.d.fits.MF.indexOf(h.id) >= 0 ? 'Deal?' : 'Not interested';
      case 2:
        if (h.plug !== 'NEUTRAL' && b.d.plug.role !== 'owner' && b.plug !== h.plug && rand() < 0.4) { b.plug = h.plug; pushFeed(b.d.short + ' NOW BACKS ' + PLUG[h.plug].toUpperCase()); return 'Deal?'; }
        return b.plug === h.plug ? 'Our standing is high' : 'Not interested';
      case 3: return needOf(b, 'JV', h) ? 'Deal?' : 'Not interested';
      case 4: return needOf(b, 'LI', h) ? 'Deal?' : 'Watch ' + leader([h, b]).d.short;
      case 6: return anyFit ? 'Deal?' : 'Not interested';
      case 7: return 'Our standing is high';
      default: return 'Not interested';
    }
  }
  function logWhisper(s) { G.whisperLog.unshift(s); var el = $('#wh-feed'); if (el) el.innerHTML = G.whisperLog.slice(0, 4).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join(''); }
  ACT.plug = function (a) {
    if (G.phase !== 'board' || G.locked || G.hco.d.plug.role === 'owner') return;
    G.hco.plug = a; $$('[data-act="plug"]').forEach(function (b) { b.classList.toggle('sel', b.getAttribute('data-arg') === a); });
    var n = $('#plug-note'); if (n) n.textContent = 'You back ' + PLUG[a] + '. Locked at the M2 reveal.';
  };
  function scoreDeals() {
    G.deals.forEach(function (d) {
      if (d.status !== 'signed' || d.scored) return; d.scored = true;
      var a = G.byId[d.a], b = G.byId[d.b];
      var needA = needOf(a, d.T, b), needB = needOf(b, INV[d.T], a);
      d.fit = needA && needB;
      var lic = d.T === 'LO' ? a : d.T === 'LI' ? b : null;
      var lab = 'M2 deal · ' + TSHORT[d.T] + ' ' + a.d.short + '×' + b.d.short;
      if (d.fit) {
        [a, b].forEach(function (c) { addEV(c, (c === lic && c.d.natureLicenseOut) ? 8 : 6, lab + ' (fit)', 'M2'); c.fitDeals++; });
      } else {
        if (!needA) addEV(a, -5, lab + ' (misfit)', 'M2');
        if (!needB) addEV(b, -5, lab + ' (misfit)', 'M2');
      }
      a.deals++; b.deals++;
      addPts(seatPlayer(a, 'CEO'), 25, 'Deal signer'); addPts(seatPlayer(b, 'CEO'), 25, 'Deal signer');
    });
  }
  function plugCounts() { var c = { LECCS: [], TYPE6: [], NEUTRAL: [] }; G.cos.forEach(function (x) { c[x.plug].push(x); }); return c; }
  function resolvePlugWar() {
    var c = plugCounts(), w = null, l = null;
    if (c.LECCS.length > c.TYPE6.length) { w = 'LECCS'; l = 'TYPE6'; } else if (c.TYPE6.length > c.LECCS.length) { w = 'TYPE6'; l = 'LECCS'; }
    G.plugResult = { winner: w, loser: l, counts: { LECCS: c.LECCS.length, TYPE6: c.TYPE6.length, NEUTRAL: c.NEUTRAL.length } };
    if (!w) return;
    c[w].forEach(function (x) { addEV(x, x.id === PLUG_OWNER[w] ? 20 : 5, 'Plug War · ' + PLUG[w] + ' wins (' + (x.id === PLUG_OWNER[w] ? 'owner' : 'backer') + ')', 'M3'); });
    c[l].forEach(function (x) { addEV(x, x.id === PLUG_OWNER[l] ? -10 : -3, 'Plug War · ' + PLUG[l] + ' loses (' + (x.id === PLUG_OWNER[l] ? 'owner' : 'backer') + ')', 'M3'); });
  }

  /* ------------------------------------------------------------ resolve + reveal */
  function teamRanks() { return G.cos.slice().sort(function (a, b) { return b.ev - a.ev || a.d.name.localeCompare(b.d.name); }); }
  function classRanks() { return G.players.slice().sort(function (a, b) { return b.pts - a.pts || ((a.bot ? 1 : 0) - (b.bot ? 1 : 0)) || a.name.localeCompare(b.name); }); }
  function snapshot() { G.prevTeam = {}; teamRanks().forEach(function (c, i) { G.prevTeam[c.id] = i + 1; }); }
  function resolveMeeting() {
    var m = G.meeting; snapshot();
    G.cos.forEach(function (co) {
      var x = md(co, m), b = co.board, g = grade(co, m, b.opt), tag = 'M' + m;
      addEV(co, PTS[m][g], tag + ' ' + ({ 1: 'stage call', 2: 'route', 3: 'keep / switch' })[m] + ' · ' + g, tag);
      var right = co.players.filter(function (p) { return p.pc[m] && p.pc[m].opt === x.key; }).length;
      if (right >= 4) addEV(co, 5, tag + ' aligned board (' + right + '/5)', tag);
      if (g !== 'wrong' && !b.missed) { var sp = Math.round(3 * Math.max(0, (BOARD_T - b.lockT) / BOARD_T)); if (sp > 0) addEV(co, sp, tag + ' speed', tag); }
      if (b.missed) addEV(co, -5, tag + ' missed window', tag);
      if (g === 'right') addPts(seatPlayer(co, x.decider), 50, tag + ' deciding card');
      co.dec[m] = { opt: b.opt, grade: g, missed: b.missed, right: right };
    });
    if (m === 2) scoreDeals();
    if (m === 3) resolvePlugWar();
  }
  function stampFor(co, m) {
    var dec = co.dec[m], g = dec.grade;
    if (m === 3) return { t: dec.opt === 0 ? 'KEEP' : 'SWITCH', cls: g === 'wrong' ? 'dim' : 'gold' };
    if (g === 'wrong') return { t: 'KILLED', cls: 'dim' };
    if (m === 2 && /licen[cs]e/i.test(md(co, 2).options[dec.opt])) return { t: 'LICENSED', cls: 'gold' + (g !== 'right' ? ' part' : '') };
    return { t: 'APPROVED', cls: 'gold' + (g !== 'right' ? ' part' : '') };
  }
  var GRADE_TXT = { right: '✓ RIGHT', near: '≈ NEAR', partly: '≈ PARTLY', wrong: '✗ WRONG' };
  function revealCardHTML(co, i) {
    var m = G.meeting, x = md(co, m), dec = co.dec[m], tag = 'M' + m;
    var ents = co.ledger.filter(function (e) { return e.m === tag; }), tot = 0; ents.forEach(function (e) { tot += e.d; }); tot = r1(tot);
    var st = stampFor(co, m);
    return '<div class="flip ' + (co === G.hco ? 'you' : '') + '" style="--d:' + (i * 70) + 'ms">' +
      '<div class="flip-front" aria-hidden="true"><span class="mono">' + esc(co.d.short) + '</span><b>?</b></div>' +
      '<div class="flip-back sticker" style="--tilt:' + tilt(i) + '">' +
      '<div class="fb-head"><b>' + esc(co.d.name) + '</b>' + (co === G.hco ? '<em class="you-tag mono">YOU</em>' : '') + '<span class="grade mono g-' + dec.grade + '">' + GRADE_TXT[dec.grade] + '</span></div>' +
      '<div class="fb-call mono">CALL ▸ <span>' + esc(x.options[dec.opt]) + '</span>' + (dec.missed ? ' <em>(auto-locked)</em>' : '') + '</div>' +
      '<div class="stamp ' + st.cls + '">' + st.t + '</div>' +
      '<div class="fb-delta mono ' + (tot >= 0 ? 'up' : 'down') + '">' + fmtD(tot) + ' <small>EV → ' + fmtEV(co.ev) + '</small></div>' +
      '<ul class="fb-parts mono">' + ents.map(function (e) { return '<li data-delta="' + e.d + '"><span>' + esc(e.l.replace(/^M\d\s/, '')) + '</span><b>' + fmtD(e.d) + '</b></li>'; }).join('') + '</ul>' +
      '<p class="fb-why">' + esc(x.why) + '</p>' +
      '<p class="fb-real"><span class="mono">' + (m === 3 ? 'REALITY CHECK' : 'WHAT REALLY HAPPENED') + '</span> ' + esc(x.real) + '</p>' +
      '<div class="fb-dec mono">DECIDING CARD ▸ ' + SEATLABEL[x.decider] + ' · ' + esc(m === 1 ? 'milestone evidence' : D.FACTOR_LABEL[x.factor]) + '</div>' +
      '</div></div>';
  }
  function dealNetHTML() {
    var W = 640, H = 360, cx = W / 2, cy = H / 2, rx = 240, ry = 132, pos = {};
    G.cos.forEach(function (co, i) { var a = -Math.PI / 2 + i * 2 * Math.PI / G.cos.length; pos[co.id] = [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
    var signed = G.deals.filter(function (d) { return d.status === 'signed'; });
    var lines = signed.map(function (d) {
      var p1 = pos[d.a], p2 = pos[d.b], mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
      return '<line class="dl ' + (d.fit ? 'fit' : 'misfit') + '" x1="' + p1[0].toFixed(1) + '" y1="' + p1[1].toFixed(1) + '" x2="' + p2[0].toFixed(1) + '" y2="' + p2[1].toFixed(1) + '"/>' +
        '<text class="dl-t" x="' + mx.toFixed(1) + '" y="' + (my - 4).toFixed(1) + '">' + TSHORT[d.T] + (d.fit ? '' : ' ✗') + '</text>';
    }).join('');
    var nodes = G.cos.map(function (co) {
      var p = pos[co.id];
      return '<g class="dn ' + (co === G.hco ? 'you' : '') + '"><rect x="' + (p[0] - 58).toFixed(1) + '" y="' + (p[1] - 14).toFixed(1) + '" width="116" height="28" rx="14"/><text x="' + p[0].toFixed(1) + '" y="' + (p[1] + 4).toFixed(1) + '">' + esc(co.d.short) + '</text></g>';
    }).join('');
    return '<div class="deal-net frame"><div class="kicker mono">DEAL NETWORK · ' + signed.length + ' SIGNED · gold = fits both sides · dashed = misfit</div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Deal network between the eight boards">' + lines + nodes + '</svg></div>';
  }
  function plugBarsHTML(final) {
    var c = plugCounts(), r = G.plugResult;
    return '<div class="plug-war frame"><div class="kicker mono">PLUG WAR · ' + (final ? 'RESULT' : 'BACKERS LOCKED') + '</div>' +
      ['LECCS', 'TYPE6', 'NEUTRAL'].map(function (k) {
        return '<div class="pw-row ' + (final && r && r.winner === k ? 'win' : '') + ' pw-' + k + '"><span class="pw-l mono">' + PLUG[k] + '</span><span class="pw-bar"><i style="width:' + (c[k].length / 8 * 100) + '%"></i></span><span class="pw-n mono">' + c[k].length + '</span>' +
          '<span class="pw-who mono">' + c[k].map(function (x) { return x === G.hco ? '<b>' + esc(x.d.short) + '</b>' : esc(x.d.short); }).join(' · ') + '</span></div>';
      }).join('') +
      (final ? '<p class="pw-res">' + (r && r.winner ? '<b>' + PLUG[r.winner] + ' wins the plug war.</b> Owner +20, backers +5 · ' + PLUG[r.loser] + ' owner −10, backers −3.' : '<b>Stalemate.</b> Equal backers — no plug-war payouts.') + '</p>' : '<p class="mono muted small">Resolves at the Meeting 3 reveal: more backers wins.</p>') + '</div>';
  }
  function phaseReveal() {
    enter('reveal'); music('reveal');
    var m = G.meeting, co = G.hco, x = md(co, m), dec = co.dec[m];
    var myPc = G.human.pc[m];
    var pcLine = myPc ? ('Your private call: <b>' + esc(x.options[myPc.opt]) + '</b> ' + (myPc.opt === x.key ? '✓' : '✗')) : 'You missed the private call.';
    render('<section class="screen meeting reveal">' + meetHead('reveal') +
      (m === 3 ? '<div class="reveal-banner">' + plugBarsHTML(true) + '</div>' : '') +
      '<div class="reveal-you frame"><div class="ry-head"><div><div class="kicker mono">YOUR BOARD · THE DECIDING CARD</div><p class="small">' + pcLine + ' · Board: <b>' + GRADE_TXT[dec.grade] + '</b> · ' + dec.right + '/5 private calls right</p></div>' + scribArrow() + '</div>' +
      '<div class="seats">' + D.SEATS.map(function (s, i) { return seatCardHTML(co, s.id, m, true, s.id === x.decider, i); }).join('') + '</div></div>' +
      '<div class="kicker mono reveal-k">ALL EIGHT BOARDS FLIP</div><div class="flip-grid">' + G.cos.map(revealCardHTML).join('') + '</div>' +
      (m === 2 ? '<div class="m2-extras">' + dealNetHTML() + plugBarsHTML(false) + '</div>' : '') +
      '<div class="cont-row"><button class="btn gold" data-act="cont">Standings ▸</button></div></section>');
    updTicker(); updHud();
    if (dec.grade === 'right') later(0.6, function () { confetti(120); });
    if (m === 3 && G.plugResult && G.plugResult.winner && co.plug === G.plugResult.winner) later(1.2, function () { confetti(90); });
    setTimer(REVEAL_T, phaseStandings);
  }

  /* ------------------------------------------------------------ boards */
  function teamBoardHTML() {
    return '<ol class="tb">' + teamRanks().map(function (co, i) {
      var prev = G.prevTeam[co.id], mv = prev ? prev - (i + 1) : 0;
      return '<li class="tb-row ' + (co === G.hco ? 'you' : '') + '" data-co="' + co.id + '" data-ev="' + co.ev.toFixed(1) + '">' +
        '<span class="rk mono">' + (i + 1) + '</span><span class="mv mono ' + (mv > 0 ? 'up' : mv < 0 ? 'down' : '') + '">' + (mv > 0 ? '▲' + mv : mv < 0 ? '▼' + (-mv) : '—') + '</span>' +
        '<span class="nm">' + esc(co.d.name) + (co === G.hco ? ' <em class="you-tag mono">YOU</em>' : '') + '</span><span class="ev mono">' + fmtEV(co.ev) + '</span>' +
        '<details class="ledger"><summary class="mono">EV ledger · ' + co.ledger.length + ' lines</summary><ul><li class="mono"><span>Start</span><b>100</b></li>' +
        co.ledger.map(function (e) { return '<li data-delta="' + e.d + '"><span>' + esc(e.l) + '</span><b class="mono">' + fmtD(e.d) + '</b></li>'; }).join('') + '</ul></details></li>';
    }).join('') + '</ol>';
  }
  function classBoardHTML() {
    var rows = classRanks(), me = G.human ? rows.indexOf(G.human) + 1 : 0;
    return (me ? '<div class="cb-you mono">You: #' + me + ' of ' + rows.length + '</div>' : '') + '<ol class="cb">' + rows.map(function (p, i) {
      return '<li class="cb-row ' + (p.bot ? '' : 'you') + '"><span class="rk mono">' + (i + 1) + '</span><span class="nm">' + esc(p.name) + (p.bot ? ' <em class="bot mono">BOT</em>' : ' <em class="you-tag mono">YOU</em>') + '</span>' +
        '<span class="cbco mono">' + esc(G.byId[p.co].d.short) + ' · ' + (p.seat === 'ALLY' ? 'ALLIANCES' : p.seat) + '</span><span class="pts mono">' + p.pts + '</span></li>';
    }).join('') + '</ol>';
  }
  function openBoards(tab) {
    G.boardsTab = tab || 'team';
    var ov = $('#overlay'); if (!ov) return;
    var names = { team: 'TEAM BOARD', 'class': 'CLASS BOARD', scoring: 'SCORING' };
    ov.innerHTML = '<div class="ov-panel frame" role="dialog" aria-modal="true" aria-label="Boards"><div class="ov-head"><div class="tabs" role="tablist">' +
      ['team', 'class', 'scoring'].map(function (t) { return '<button class="tab mono ' + (t === G.boardsTab ? 'on' : '') + '" role="tab" aria-selected="' + (t === G.boardsTab) + '" data-act="tab" data-arg="' + t + '">' + names[t] + '</button>'; }).join('') +
      '</div><button class="btn ghost sm" data-act="close-ov" aria-label="Close boards">Close ✕</button></div><div class="ov-body">' +
      (G.boardsTab === 'team' ? teamBoardHTML() : G.boardsTab === 'class' ? classBoardHTML() : scoringHTML()) + '</div></div>';
    ov.hidden = false;
    var you = ov.querySelector('.cb-row.you'); if (you && you.scrollIntoView) { try { you.scrollIntoView({ block: 'center' }); } catch (e) { } }
  }
  function closeOverlay() { var ov = $('#overlay'); if (ov) ov.hidden = true; }
  function phaseStandings() {
    enter('standings');
    var m = G.meeting;
    render('<section class="screen standings"><div class="kicker mono">AFTER MEETING ' + m + ' OF 3</div><h2 class="display">Standings' + scribble() + '</h2>' +
      '<div class="boards-two"><div class="frame"><div class="kicker mono">TEAM BOARD · EV</div>' + teamBoardHTML() + '</div>' +
      '<div class="frame"><div class="kicker mono">CLASS BOARD · 40 PLAYERS</div><div class="cb-scroll">' + classBoardHTML() + '</div></div></div>' +
      '<div class="cont-row"><button class="btn gold" data-act="cont">' + (m < 3 ? 'Meeting ' + (m + 1) + ' ▸' : 'Final battle ▸') + '</button></div></section>');
    var you = $('.cb-scroll .cb-row.you'); if (you) { var box = you.closest('.cb-scroll'); box.scrollTop = Math.max(0, you.offsetTop - box.clientHeight / 2); }
    setTimer(STAND_T, function () { if (m < 3) startMeeting(m + 1); else startBattle(); });
  }

  /* ------------------------------------------------------------ final battle */
  function companyItems(co) {
    var d = co.d;
    return [
      { head: 'nachiket', fmt: 'mcq', q: 'Which route fits YOUR board’s factors? (' + d.name + ', ' + d.when + ')', o: d.m2.options, a: d.m2.key, src: d.m2.src + ' · case: ' + d.name, mine: true },
      { head: 'yash', fmt: 'mcq', q: d.m1.q, o: D.STAGES, a: d.m1.key, src: 'Khalil pp.306–307 · case: ' + d.name, mine: true },
      { head: 'palash', fmt: 'mcq', q: 'WHAT-IF (' + d.name + '): ' + d.m3.whatif + ' Keep or switch?', o: d.m3.options, a: d.m3.key, src: 'Khalil Fig. 10-2 p.305 · ' + D.FACTOR_LABEL[d.m3.factor], mine: true }
    ];
  }
  function expectedDamage(eligFrac) {
    var rr = mulberry32(12345), tot = 0, N = 3000;
    for (var n = 0; n < N; n++) {
      var streak = 0, elig = rr() < eligFrac;
      for (var c = 0; c < 6; c++) {
        if (rr() < 0.65) { streak++; var dmg = 10 + Math.round(5 * rr()); if (streak >= 3) dmg = Math.round(dmg * 1.5); if (c >= 4 && elig) dmg = Math.round(dmg * 1.5); tot += dmg; }
        else streak = 0;
      }
    }
    return tot / N;
  }
  function startBattle() {
    enter('boot'); music('boss');
    render('<section class="screen boot"><div class="scanlines" aria-hidden="true"></div><div class="boot-box frame"><pre id="boot-text" class="mono"></pre><span class="cursor mono">█</span></div></section>');
    D.BOOT.forEach(function (l, i) { later(0.4 + i * 0.7, function () { var pre = $('#boot-text'); if (pre) pre.textContent += l + '\n'; }); });
    setTimer(0.4 + D.BOOT.length * 0.7 + 1.2, battleInit);
  }
  function battleInit() {
    var startEV = 0; G.cos.forEach(function (c) { startEV += c.ev; });
    var elig = {}, ne = 0;
    G.cos.forEach(function (c) { elig[c.id] = c.fitDeals > 0 || !!(G.plugResult && G.plugResult.winner && c.plug === G.plugResult.winner); if (elig[c.id]) ne++; });
    var hp = Math.round(0.85 * G.players.length * expectedDamage(ne / G.cos.length));
    var heads = D.PERSONAS.map(function (p) { return p.id; });
    var order = shuffle(heads).concat([pick(heads), pick(heads)]);
    var items = companyItems(G.hco);
    var bank = D.QUESTIONS.map(function (q) { return q; });
    G.battle = { cycle: 0, startEV: r1(startEV), elig: elig, hp: hp, max: hp, order: order, used: [], bank: bank, items: items, mineUsed: 0, ans: null, sel: [], last: null, fell: false };
    G.cos.forEach(function (c) { c.dmg = 0; });
    enter('telegraph');
    render('<section class="screen battle"><div class="scanlines" aria-hidden="true"></div>' +
      '<div class="boss frame"><div class="boss-id"><div class="kicker mono">FINAL BATTLE · 6 CYCLES · FORMAT WAR IN 5–6</div><h2 class="display boss-name">THE CLOSED PLUG</h2>' +
      '<p class="muted small">A fictional incumbent that keeps its charging plug closed — Betamax’s mistake.</p></div>' +
      '<div class="hp"><div class="hp-bar"><i id="hp-fill"></i></div><div class="hp-num mono" id="hp-num"></div></div>' +
      '<div class="heads-row">' + D.PERSONAS.map(function (p) { return personaHTML(p, 'md'); }).join('') + '</div>' +
      '<div class="cycle-ind mono" id="cycle-ind"></div></div>' +
      '<div class="arena frame" id="arena"></div>' +
      '<aside class="dmg-board frame"><div class="kicker mono">DAMAGE BY BOARD</div><ul id="dmg-list"></ul><p class="mono muted small">Pool at the end: 20% of class EV (' + fmtEV(G.battle.startEV * 0.2) + '), split by damage share.</p></aside></section>');
    updBoss(); updDmg();
    cycleStart();
  }
  function updBoss() {
    var B = G.battle; var f = $('#hp-fill'), n = $('#hp-num'), c = $('#cycle-ind');
    if (f) f.style.width = (B.hp / B.max * 100).toFixed(1) + '%';
    if (n) n.textContent = 'HP ' + B.hp + ' / ' + B.max;
    if (c) c.innerHTML = range(6).map(function (i) { return '<span class="cy ' + (i < B.cycle ? 'done' : i === B.cycle ? 'on' : '') + (i >= 4 ? ' fw' : '') + '">' + (i + 1) + '</span>'; }).join('') + '<span class="cy-l">' + (B.cycle >= 4 ? 'FORMAT WAR' : 'CYCLE ' + (B.cycle + 1) + ' / 6') + '</span>';
  }
  function updDmg() {
    var el = $('#dmg-list'); if (!el) return;
    var rows = G.cos.slice().sort(function (a, b) { return b.dmg - a.dmg; }), max = Math.max(1, rows[0].dmg);
    el.innerHTML = rows.map(function (c) { return '<li class="' + (c === G.hco ? 'you' : '') + '"><span class="mono">' + esc(c.d.short) + (G.battle.elig[c.id] ? ' <em title="Alliance Strike in cycles 5–6">★</em>' : '') + '</span><span class="db-bar"><i style="width:' + (c.dmg / max * 100) + '%"></i></span><b class="mono">' + c.dmg + '</b></li>'; }).join('');
  }
  function pickQ(head) {
    var B = G.battle;
    var mine = B.items.filter(function (q) { return q.head === head && B.used.indexOf(q) < 0; });
    if (mine.length && B.mineUsed < 2 && (head === 'nachiket' || rand() < 0.5)) { B.mineUsed++; B.used.push(mine[0]); return mine[0]; }
    var pool = B.bank.filter(function (q) { return q.head === head && B.used.indexOf(q) < 0; });
    if (!pool.length) pool = B.bank.filter(function (q) { return B.used.indexOf(q) < 0; });
    var q = pick(pool); B.used.push(q); return q;
  }
  function cycleStart() {
    var B = G.battle, c = B.cycle; enter('telegraph');
    B.head = B.order[c]; B.q = pickQ(B.head); B.ans = null; B.sel = [];
    var p = persona(B.head);
    D.PERSONAS.forEach(function (x) { setHead(x.id, x.id === B.head ? 'attack' : 'idle'); });
    updBoss();
    $('#arena').innerHTML = '<div class="telegraph" style="--aura:' + p.color + '"><div class="tg-k mono">INCOMING · CYCLE ' + (c + 1) + ' / 6</div>' +
      '<div class="tg-banner display">' + esc(p.title.toUpperCase()) + ' · ' + esc(p.attack) + '</div><div class="mono muted">' + esc(p.name) + ' · ' + esc(p.topics) + '</div>' +
      (c >= 4 ? '<div class="fw-banner mono">FORMAT WAR · ALLIANCE STRIKE +50% for boards on the winning plug or with fitting deals' + (B.elig[G.hco.id] ? ' · YOUR BOARD QUALIFIES ★' : '') + '</div>' : '') + '</div>';
    setTimer(3, answerStart);
  }
  var FMT_NAME = { mcq: 'MULTIPLE CHOICE', tf: 'TRUE / FALSE', order: 'PUT IN ORDER', multi: 'PICK ALL THAT APPLY' };
  function answerStart() {
    var B = G.battle, q = B.q, c = B.cycle, p = persona(B.head); enter('answer');
    var ui = '';
    if (q.fmt === 'mcq') ui = '<div class="opts">' + q.o.map(function (o, i) { return '<button class="opt" data-act="ans" data-arg="' + i + '"><span class="L mono">' + 'ABCDEF'[i] + '</span>' + esc(o) + '</button>'; }).join('') + '</div>';
    else if (q.fmt === 'tf') ui = '<div class="opts two"><button class="opt" data-act="ans" data-arg="true"><span class="L mono">T</span>True</button><button class="opt" data-act="ans" data-arg="false"><span class="L mono">F</span>False</button></div>';
    else if (q.fmt === 'multi') ui = '<div class="opts">' + q.o.map(function (o, i) { return '<button class="opt tog" data-act="tog" data-arg="' + i + '" aria-pressed="false"><span class="L mono">☐</span>' + esc(o) + '</button>'; }).join('') + '</div><button class="btn gold" data-act="ans-multi">Submit ▸</button>';
    else if (q.fmt === 'order') {
      B.disp = shuffle(range(q.o.length));
      ui = '<div class="seq mono" id="seq">Tap in order →</div><div class="opts">' + B.disp.map(function (i) { return '<button class="opt" data-act="ord" data-arg="' + i + '"><span class="L mono">•</span>' + esc(q.o[i]) + '</button>'; }).join('') + '</div>' +
        '<div class="row-btns"><button class="btn ghost sm" data-act="ord-reset">Reset</button><button class="btn gold" data-act="ans-order" id="ord-submit" disabled>Submit order ▸</button></div>';
    }
    $('#arena').innerHTML = '<div class="qbox" style="--aura:' + p.color + '"><div class="q-meta mono">' + esc(p.title.toUpperCase()) + ' · ' + FMT_NAME[q.fmt] + (q.mine ? ' · YOUR CASE' : '') + '</div>' +
      '<h3 class="q">' + esc(q.q) + '</h3>' + ui + '<div class="mono muted small" id="ans-status">Fast + right = more damage. Three in a row = crit.</div></div>';
    setTimer(c >= 4 ? 14 : 18, resolveCycle);
    if (AUTO) later(1.5 + rand() * 5, autoAnswer);
  }
  function lockAnswer(ok) {
    var B = G.battle; if (G.phase !== 'answer' || B.ans) return;
    B.ans = { ok: ok, left: G.timer ? Math.max(0, G.timer.left / G.timer.total) : 0 };
    $$('#arena button').forEach(function (b) { b.disabled = true; });
    var s = $('#ans-status'); if (s) s.textContent = 'Answer locked — waiting for the class…';
    if (G.timer && G.timer.left > 1.2) G.timer.left = 1.2;
  }
  ACT.ans = function (a, el) {
    if (G.phase !== 'answer') return; var q = G.battle.q;
    el.classList.add('sel');
    if (q.fmt === 'tf') lockAnswer((a === 'true') === q.a); else lockAnswer(+a === q.a);
  };
  ACT.tog = function (a, el) {
    if (G.phase !== 'answer' || G.battle.ans) return; var B = G.battle, i = +a, k = B.sel.indexOf(i);
    if (k >= 0) B.sel.splice(k, 1); else B.sel.push(i);
    el.classList.toggle('sel', k < 0); el.setAttribute('aria-pressed', k < 0 ? 'true' : 'false'); el.querySelector('.L').textContent = k < 0 ? '☑' : '☐';
  };
  ACT['ans-multi'] = function () {
    var B = G.battle; if (G.phase !== 'answer' || B.ans) return;
    var s = B.sel.slice().sort(function (x, y) { return x - y; }), t = B.q.a.slice().sort(function (x, y) { return x - y; });
    lockAnswer(s.length === t.length && s.every(function (v, i) { return v === t[i]; }));
  };
  ACT.ord = function (a, el) {
    var B = G.battle; if (G.phase !== 'answer' || B.ans || B.sel.indexOf(+a) >= 0) return;
    B.sel.push(+a); el.classList.add('sel'); el.querySelector('.L').textContent = String(B.sel.length);
    var sq = $('#seq'); if (sq) sq.textContent = B.sel.map(function (i) { return B.q.o[i]; }).join(' → ');
    var sb = $('#ord-submit'); if (sb) sb.disabled = B.sel.length !== B.q.o.length;
  };
  ACT['ord-reset'] = function () {
    var B = G.battle; if (G.phase !== 'answer' || B.ans) return; B.sel = [];
    $$('[data-act="ord"]').forEach(function (b) { b.classList.remove('sel'); b.querySelector('.L').textContent = '•'; });
    var sq = $('#seq'); if (sq) sq.textContent = 'Tap in order →'; var sb = $('#ord-submit'); if (sb) sb.disabled = true;
  };
  ACT['ans-order'] = function () { var B = G.battle; if (G.phase !== 'answer' || B.ans) return; lockAnswer(B.sel.length === B.q.a.length && B.sel.every(function (v, i) { return v === B.q.a[i]; })); };
  function autoAnswer() {
    var q = G.battle.q, good = rand() < 0.7;
    if (q.fmt === 'mcq') { var i = good ? q.a : pick(range(q.o.length).filter(function (k) { return k !== q.a; })); autoClick('[data-act="ans"][data-arg="' + i + '"]'); }
    else if (q.fmt === 'tf') autoClick('[data-act="ans"][data-arg="' + (good ? q.a : !q.a) + '"]');
    else if (q.fmt === 'multi') { (good ? q.a : q.a.slice(0, Math.max(1, q.a.length - 1))).forEach(function (k) { autoClick('[data-act="tog"][data-arg="' + k + '"]'); }); autoClick('[data-act="ans-multi"]'); }
    else if (q.fmt === 'order') { var seq = q.a.slice(); if (!good) { var t = seq[0]; seq[0] = seq[1]; seq[1] = t; } seq.forEach(function (k) { autoClick('[data-act="ord"][data-arg="' + k + '"]'); }); autoClick('[data-act="ans-order"]'); }
  }
  function correctText(q) {
    if (q.fmt === 'tf') return q.a ? 'True' : 'False';
    if (q.fmt === 'mcq') return q.o[q.a];
    if (q.fmt === 'order') return q.a.map(function (i) { return q.o[i]; }).join(' → ');
    return q.a.map(function (i) { return q.o[i]; }).join(' + ');
  }
  function resolveCycle() {
    var B = G.battle, c = B.cycle, fw = c >= 4; enter('resolve');
    var tot = 0, nRight = 0, wrongBy = {}, rightBy = {}, my = null;
    G.players.forEach(function (p) {
      var co = G.byId[p.co], ok, left;
      if (p.bot) { ok = rand() < BOTACC; left = rand(); } else { ok = !!(B.ans && B.ans.ok); left = B.ans ? B.ans.left : 0; }
      if (ok) {
        p.streak++; var dmg = 10 + Math.round(5 * left), crit = p.streak >= 3, ally = fw && B.elig[co.id];
        if (crit) dmg = Math.round(dmg * 1.5); if (ally) dmg = Math.round(dmg * 1.5);
        p.dmg += dmg; co.dmg += dmg; tot += dmg; nRight++; rightBy[co.id] = (rightBy[co.id] || 0) + 1;
        addPts(p, 10 * dmg, 'Battle cycle ' + (c + 1));
        if (!p.bot) my = { ok: true, dmg: dmg, crit: crit, ally: ally };
      } else { p.streak = 0; wrongBy[co.id] = (wrongBy[co.id] || 0) + 1; if (!p.bot) my = { ok: false, answered: !!B.ans }; }
    });
    Object.keys(wrongBy).forEach(function (id) { var co = G.byId[id]; addEV(co, -(5 / co.players.length) * wrongBy[id], 'Battle cycle ' + (c + 1) + ' · ' + wrongBy[id] + ' wrong', 'B'); });
    B.hp = Math.max(0, B.hp - tot); B.last = { tot: tot, nRight: nRight, rightBy: rightBy };
    var p = persona(B.head);
    $('#arena').innerHTML = '<div class="resolve ' + (my.ok ? 'ok' : 'bad') + '">' +
      (my.ok ? '<div class="dmg-pop display">+' + my.dmg + ' DMG' + (my.crit ? ' <span class="crit">CRIT ×1.5</span>' : '') + (my.ally ? ' <span class="crit">ALLIANCE ×1.5</span>' : '') + '</div>'
        : '<div class="counter display">COUNTER-ATTACK</div><div class="mono">' + (my.answered ? 'Wrong answer' : 'No answer') + ' · your board −' + (5 / G.hco.players.length) + ' EV</div>') +
      '<p class="ans-line"><span class="mono">ANSWER ▸</span> ' + esc(correctText(B.q)) + '</p><p class="src mono">SOURCE ▸ ' + esc(B.q.src) + '</p>' +
      '<div class="class-line mono">CLASS ▸ ' + nRight + '/' + G.players.length + ' right · ' + tot + ' damage to ' + esc(p.title) + '’s plug</div></div>';
    if (!my.ok) { flash(); setHead(B.head, 'attack'); } else D.PERSONAS.forEach(function (x) { setHead(x.id, 'hit'); });
    updBoss(); updDmg(); updHud();
    setTimer(4, function () { if (B.hp <= 0) battleEnd(true); else if (c >= 5) battleEnd(false); else { B.cycle++; cycleStart(); } });
  }
  function battleEnd(fell) {
    var B = G.battle; B.fell = fell; enter('end');
    var pool = r1(B.startEV * 0.2 * (fell ? 1 : 0.5)), totD = 0; G.cos.forEach(function (c) { totD += c.dmg; }); totD = totD || 1;
    G.cos.forEach(function (c) { var share = c.dmg / totD, pay = r1(pool * share); if (pay) addEV(c, pay, 'Battle payout · ' + Math.round(share * 100) + '% of damage', 'B'); });
    if (fell) G.cos.forEach(function (c) { if ((B.last.rightBy[c.id] || 0) >= 3) addEV(c, 5, 'Finishing blow (last cycle)', 'B'); addEV(c, 5, 'Boss falls', 'B'); });
    D.PERSONAS.forEach(function (x) { setHead(x.id, fell ? 'defeated' : 'victory'); });
    updBoss(); updDmg(); updHud(); updTicker();
    var mine = G.hco.ledger.filter(function (e) { return e.m === 'B'; }), my = 0; mine.forEach(function (e) { my += e.d; });
    $('#arena').innerHTML = '<div class="ending ' + (fell ? 'won' : 'lost') + '"><div class="kicker mono">' + (fell ? 'BOSS DEFEATED' : 'BOSS SURVIVES') + '</div>' +
      '<h2 class="display">' + (fell ? 'THE CLOSED PLUG HAS FALLEN' : 'THE BOARD STANDS') + '</h2>' +
      '<p>' + (fell ? 'Open beats closed — the VHS lesson. Pool paid in full: ' : 'The class ran out of cycles. Half pool paid: ') + '<b>' + fmtEV(pool) + '</b> split by damage share.</p>' +
      '<p class="mono">YOUR BOARD ▸ ' + G.hco.dmg + ' damage · battle EV ' + fmtD(r1(my)) + ' · now ' + fmtEV(G.hco.ev) + '</p>' +
      '<button class="btn gold" data-act="cont">Podium ▸</button></div>';
    if (fell) { confetti(220); music('victory'); }
    setTimer(12, phasePodium);
  }

  /* ------------------------------------------------------------ podium */
  function phasePodium() {
    enter('podium'); music('victory');
    var tr = teamRanks(), cr = classRanks();
    var dm = G.cos.slice().sort(function (a, b) { return b.fitDeals - a.fitDeals || b.ev - a.ev; })[0];
    var pw = G.plugResult && G.plugResult.winner ? G.byId[PLUG_OWNER[G.plugResult.winner]] : null;
    var podium = function (list, nameFn, valFn) {
      var order = [1, 0, 2];
      return '<div class="podium">' + order.map(function (i) { var x = list[i]; if (!x) return ''; return '<div class="pod p' + (i + 1) + ' ' + ((x === G.hco || x === G.human) ? 'you' : '') + '"><div class="pod-name">' + nameFn(x) + '</div><div class="pod-val mono">' + valFn(x) + '</div><div class="pod-block display">' + (i + 1) + '</div></div>'; }).join('') + '</div>';
    };
    var award = function (t, who, why, stamp, i) { return '<div class="award sticker tape" style="--tilt:' + tilt(i) + '"><div class="kicker mono">' + t + '</div><div class="aw-who display">' + who + '</div><p class="small muted">' + why + '</p><div class="stamp ' + (stamp === 'KILLED' ? 'dim' : 'gold') + '">' + stamp + '</div></div>'; };
    render('<section class="screen podium-screen"><div class="kicker mono">FINAL · ' + (G.battle && G.battle.fell ? 'THE CLOSED PLUG HAS FALLEN' : 'THE BOARD STANDS') + '</div><h2 class="display">Podium' + scribble() + '</h2>' +
      '<div class="pod-two"><div class="frame"><div class="kicker mono">TOP COMPANIES · EV</div>' + podium(tr, function (c) { return esc(c.d.name); }, function (c) { return fmtEV(c.ev); }) + '</div>' +
      '<div class="frame"><div class="kicker mono">TOP PLAYERS · POINTS</div>' + podium(cr, function (p) { return esc(p.name) + ' <small class="mono">' + esc(G.byId[p.co].d.short) + '</small>'; }, function (p) { return p.pts + ' pts'; }) + '</div></div>' +
      '<div class="awards">' +
      award('MARKET LEADER', esc(tr[0].d.name), 'Highest EV: ' + fmtEV(tr[0].ev), 'APPROVED', 0) +
      award('MVP', esc(cr[0].name) + ' · ' + esc(G.byId[cr[0].co].d.short), cr[0].pts + ' points on the class board', 'APPROVED', 1) +
      award('DEALMAKER', dm.fitDeals ? esc(dm.d.name) : 'No fitting deals', dm.fitDeals ? dm.fitDeals + ' fitting deal' + (dm.fitDeals > 1 ? 's' : '') : 'Nobody signed a deal that fit both sides', 'LICENSED', 2) +
      award('PLUG CHAMPION', pw ? esc(pw.d.name) : 'Stalemate', pw ? PLUG[G.plugResult.winner] + ' won the plug war' : 'Equal backers — no champion', pw ? 'KEEP' : 'KILLED', 3) +
      '</div>' +
      '<div class="boards-two"><div class="frame"><div class="kicker mono">TEAM BOARD · FINAL EV</div>' + teamBoardHTML() + '</div><div class="frame"><div class="kicker mono">CLASS BOARD · 40 PLAYERS</div><div class="cb-scroll">' + classBoardHTML() + '</div></div></div>' +
      '<div class="cont-row"><button class="btn" data-act="again">Play again ↻</button></div></section>');
    confetti(200);
  }

  /* ------------------------------------------------------------ boot */
  window.LR = {
    G: G, seed: SEED, speed: SPEED, auto: AUTO,
    pause: function () { G.paused = true; }, resume: function () { G.paused = false; lastReal = performance.now(); },
    openBoards: openBoards, closeBoards: closeOverlay,
    audio: function () { return Object.keys(AUD).map(function (k) { var x = AUD[k]; return k + ':' + (x ? (x.paused ? 'paused' : 'playing') : 'missing'); }).join(' '); },
    ledgerOK: function () { return G.cos.every(function (c) { var s = 100; c.ledger.forEach(function (e) { s += e.d; }); return Math.abs(r1(s) - c.ev) < 0.05; }); }
  };
  document.addEventListener('DOMContentLoaded', function () {
    var f = $('#foot'); if (f) f.textContent = D.FOOTER;
    initWorld(); phaseTitle();
  });
})();
