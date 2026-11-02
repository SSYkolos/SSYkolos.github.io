// Home page scene for laser shops: a customer drops in a drawing and sees the figures, the figures move aside, the shop
// approves, the machine cuts, and the running figures climb to exactly those set aside. Every frame is a function of
// the time t, so any moment can be replayed. The static bed and finished cuts live on one canvas, only the hot part of
// the cut, the sparks and the machine are redrawn; the interface pieces are DOM, moved with transform and opacity.
(function () {
  var root = document.querySelector("[data-hs]");
  if (!root) return;
  var laser = root.querySelector(".hs__slide--laser");
  var audit = root.querySelector(".hs__slide--audit");
  var scene = laser.querySelector(".hs-scene");
  var intro = laser.querySelector(".hs__intro");
  var steps = root.querySelectorAll(".hs__step");
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var wideQuery = window.matchMedia("(min-width: 900px)");
  var hu = (navigator.language || "").slice(0, 2).toLowerCase() === "hu";

  if (hu) {
    root.classList.add("hs--hu");
    root.querySelectorAll("[data-hu-href]").forEach(function (a) { a.href = a.dataset.huHref; });
    steps.forEach(function (b) { b.querySelector("span").textContent = b.dataset.hu; });
  }

  // Real output of the demo shop for this drawing: 6 pieces, mild steel, 8 mm.
  var COUNT = 6, CUT_M = 0.719 * COUNT, PIERCES = 5 * COUNT, GROSS = 13386;
  function fmtCut(v) { var s = v.toFixed(3); return (hu ? s.replace(".", ",") : s) + " m"; }
  function fmtPrice(v) {
    var g = String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, hu ? " " : ",");
    return hu ? g + " Ft" : "HUF " + g;
  }

  // Timeline, seconds
  var DRAG0 = .6, DRAG1 = 1.35, DROP1 = 1.6, DRAW1 = 2.2, PRICE0 = 2.4, PRICE1 = 2.85;
  var CLICK1 = 3.55, FLY0 = 3.9, FLY_LEN = .7, GHOST0 = 4.1, GHOST1 = 5.05;
  var MAIL0 = 4.8, CLICK2 = 5.65, MAIL1 = 6.3, CUT0 = 6.9, CUT1 = 13.1, HOT = 2.6;
  var END = 13.7, COOLED = CUT1 + HOT + .1, AUTO = END + 6.5;

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function span(t, a, b) { return clamp((t - a) / (b - a)); }
  function ease(v) { return v * v * (3 - 2 * v); }
  function out(v) { return 1 - (1 - v) * (1 - v) * (1 - v); }
  function lerp(a, b, q) { return a + (b - a) * q; }
  function rnd(seed) { var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  // ---- DOM helpers that only touch the page when something changed
  function op(el, v) { v = Math.round(v * 1000) / 1000; if (el._o !== v) { el._o = v; el.style.opacity = v; } }
  function tf(el, s) { if (el._t !== s) { el._t = s; el.style.transform = s; } }
  function vis(el, on) { if (el._v !== on) { el._v = on; el.style.visibility = on ? "visible" : "hidden"; } }
  function txt(el, s) { if (el._s !== s) { el._s = s; el.textContent = s; } }
  function cls(el, c, on) { var k = "_c" + c; if (el[k] !== on) { el[k] = on; el.classList.toggle(c, on); } }

  var q = function (s) { return scene.querySelector(s); };
  var card = q(".hs-card"), drop = q(".hs-drop"), prompt = q(".hs-drop__prompt"), drawing = q(".hs-draw"), fname = q(".hs-drop__name");
  var drawParts = drawing.querySelectorAll("path, circle"), rows = scene.querySelectorAll(".hs-row");
  var send = q(".hs-send"), mail = q(".hs-mail"), approve = q(".hs-approve"), file = q(".hs-file"), cursor = q(".hs-cursor"), strip = q(".hs-strip");
  var note = q(".hs-note"), story = laser.querySelectorAll(".hs__story li");
  var KEYS = ["cut", "pierce", "price"], FINAL = { cut: fmtCut(CUT_M), pierce: String(PIERCES), price: fmtPrice(GROSS) };
  var tiles = {}, slots = {}, tslots = {}, pills = {}, nows = {}, bars = {};
  KEYS.forEach(function (k) {
    tiles[k] = q('[data-tile="' + k + '"]'); slots[k] = q('.hs-slot[data-slot="' + k + '"]'); tslots[k] = q('.hs-tslot[data-slot="' + k + '"]');
    pills[k] = q('.hs-pill[data-slot="' + k + '"]'); nows[k] = tiles[k].querySelector(".hs-tile__now"); bars[k] = tiles[k].querySelector(".hs-tile__bar i");
    txt(tslots[k], FINAL[k]); txt(pills[k], FINAL[k]);
  });
  q(".hs-mail__price").textContent = FINAL.price;

  // ---- Canvases: bg holds the bed and everything finished, fx is redrawn each frame
  var bg = document.createElement("canvas"), fx = document.createElement("canvas"), base = document.createElement("canvas");
  bg.setAttribute("aria-hidden", "true"); fx.setAttribute("aria-hidden", "true");
  laser.insertBefore(fx, laser.firstChild); laser.insertBefore(bg, fx);
  var gb = bg.getContext("2d", { alpha: false }), gx = fx.getContext("2d"), gBase = base.getContext("2d");

  // Sprites: soft round light and smoke, made once so no blur is calculated while it runs
  function sprite(size, stops) {
    var c = document.createElement("canvas"); c.width = c.height = size;
    var g = c.getContext("2d"), r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(function (s) { r.addColorStop(s[0], s[1]); });
    g.fillStyle = r; g.fillRect(0, 0, size, size);
    return c;
  }
  var GLARE = sprite(128, [[0, "rgba(255,246,225,1)"], [.1, "rgba(255,214,150,.95)"], [.28, "rgba(255,140,60,.45)"], [1, "rgba(255,110,30,0)"]]);
  var SMOKE = sprite(64, [[0, "rgba(205,212,220,.32)"], [1, "rgba(205,212,220,0)"]]);

  // ---- The part, in millimetres. Inner contours first, as a real machine cuts.
  function circle(cx, cy, r) { var a = []; for (var i = 0; i <= 20; i++) a.push([cx + r * Math.cos(i / 20 * 6.28319), cy + r * Math.sin(i / 20 * 6.28319)]); return a; }
  function slot() {
    var a = [[65, 60], [95, 60]], i;
    for (i = 1; i <= 12; i++) a.push([95 + 10 * Math.sin(i / 12 * 3.14159), 50 + 10 * Math.cos(i / 12 * 3.14159)]);
    a.push([65, 40]);
    for (i = 1; i <= 12; i++) a.push([65 - 10 * Math.sin(i / 12 * 3.14159), 50 - 10 * Math.cos(i / 12 * 3.14159)]);
    return a;
  }
  function outline() {
    var a = [[0, 100], [160, 100], [160, 20]];
    for (var i = 1; i <= 12; i++) a.push([140 + 20 * Math.cos(i / 12 * 1.5708), 20 - 20 * Math.sin(i / 12 * 1.5708)]);
    a.push([0, 0], [0, 100]);
    return a;
  }
  function fine(line) { // long straight runs in short pieces, so heat can fade along them
    var o = [line[0]];
    for (var i = 1; i < line.length; i++) {
      var a = line[i - 1], b = line[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(l / 6));
      for (var k = 1; k <= n; k++) o.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
    }
    return o;
  }
  var CONTOURS = [circle(20, 20, 4.5), circle(20, 80, 4.5), slot(), circle(140, 80, 4.5), outline()].map(fine);
  var PART_PATH = new Path2D();
  CONTOURS.forEach(function (c) { c.forEach(function (p, i) { if (i) PART_PATH.lineTo(p[0], p[1]); else PART_PATH.moveTo(p[0], p[1]); }); PART_PATH.closePath(); });

  // ---- Layout and the machine's path
  var W = 0, H = 0, DPR = 1, sx = 0, sy = 0, sw = 0, sh = 0, u = 1, cols = 3, rowsN = 2, GAP = 10, sheet = null, cells = [], dirty = true, sf = 1;
  var wx, wy, wt, won, wl, wp, wn = 0, lenTotal = 1;
  var sparks = [], spCount = 0, keysCursor = [], from = {}, pv = null, fileA = null, fileB = null;
  var bakedIdx = 0, ghostBaked = false, low = false;

  function rel(el) { var b = el.getBoundingClientRect(), s = scene.getBoundingClientRect(); return { x: b.left - s.left, y: b.top - s.top, w: b.width, h: b.height }; }

  function buildPath() {
    var order = [], r, c;
    for (r = 0; r < rowsN; r++) for (c = 0; c < cols; c++) order.push({ r: r, c: r % 2 ? cols - 1 - c : c });
    cells = order.map(function (o) { return { x: sheet.nx + o.c * (160 + GAP) * u, y: sheet.ny + o.r * (100 + GAP) * u }; });
    var seq = [], cutLen = 0, travel = 0, px = null, py = null;
    cells.forEach(function (cell, ci) {
      CONTOURS.forEach(function (line) {
        var pts = line.map(function (p) { return [cell.x + p[0] * u, cell.y + p[1] * u]; });
        var mm = line.map(function (p) { return p; }), l = 0;
        for (var i = 1; i < mm.length; i++) l += Math.hypot(mm[i][0] - mm[i - 1][0], mm[i][1] - mm[i - 1][1]);
        if (px !== null) travel += Math.hypot(pts[0][0] - px, pts[0][1] - py) / u;
        px = pts[pts.length - 1][0]; py = pts[pts.length - 1][1];
        cutLen += l; seq.push({ pts: pts, mm: mm, part: ci });
      });
    });
    lenTotal = cutLen;
    var RAPID = 5, DWELL = .05, v = (cutLen + travel / RAPID) / (CUT1 - CUT0 - seq.length * DWELL);
    var n = 0; seq.forEach(function (s) { n += s.pts.length + 2; });
    wx = new Float32Array(n); wy = new Float32Array(n); wt = new Float32Array(n); won = new Uint8Array(n); wl = new Float32Array(n); wp = new Uint8Array(n);
    var t = CUT0, l = 0, pc = 0, k = 0, lx = null, ly = null;
    seq.forEach(function (s) {
      var a = s.pts[0];
      if (lx !== null) t += Math.hypot(a[0] - lx, a[1] - ly) / u / (RAPID * v);
      wx[k] = a[0]; wy[k] = a[1]; wt[k] = t; won[k] = 0; wl[k] = l; wp[k] = pc; k++;
      t += DWELL; pc++;
      wx[k] = a[0]; wy[k] = a[1]; wt[k] = t; won[k] = 0; wl[k] = l; wp[k] = pc; k++;
      for (var i = 1; i < s.pts.length; i++) {
        var d = Math.hypot(s.mm[i][0] - s.mm[i - 1][0], s.mm[i][1] - s.mm[i - 1][1]);
        t += d / v; l += d;
        wx[k] = s.pts[i][0]; wy[k] = s.pts[i][1]; wt[k] = t; won[k] = 1; wl[k] = l; wp[k] = pc; k++;
      }
      lx = s.pts[s.pts.length - 1][0]; ly = s.pts[s.pts.length - 1][1];
    });
    wn = k;

    // Sparks: a steady stream while cutting, a burst at each pierce. Sorted by birth, so only the live ones are visited.
    sparks = [];
    var rate = W < 700 ? 55 : 95, total = Math.round((CUT1 - CUT0) * rate), j, h;
    for (j = 0; j < total; j++) {
      var born = CUT0 + (j + rnd(j)) / total * (CUT1 - CUT0);
      h = idxAt(born);
      if (h + 1 >= wn || !won[h + 1]) continue;
      var f = (born - wt[h]) / (wt[h + 1] - wt[h] || 1);
      sparks.push({ b: born, x: lerp(wx[h], wx[h + 1], f), y: lerp(wy[h], wy[h + 1], f), vx: (rnd(j + 11) - .5) * 290 * sf, vy: (-50 - rnd(j + 12) * 240) * sf, l: .22 + rnd(j + 13) * .48 });
    }
    for (j = 1; j < wn; j++) if (wp[j] > wp[j - 1]) {
      for (var e = 0; e < 11; e++) {
        var a2 = rnd(j + e * 7) * 6.283, sp = (70 + rnd(j + e * 9) * 250) * sf;
        sparks.push({ b: wt[j - 1] + rnd(j + e) * .05, x: wx[j], y: wy[j], vx: Math.cos(a2) * sp, vy: Math.sin(a2) * sp - 60 * sf, l: .18 + rnd(j + e * 3) * .34 });
      }
    }
    sparks.sort(function (a, b) { return a.b - b.b; });
    spCount = sparks.length;
  }

  function idxAt(t) { // the last waypoint at or before t
    var a = 0, b = wn - 1;
    if (t <= wt[0]) return 0;
    if (t >= wt[b]) return b;
    while (b - a > 1) { var m = (a + b) >> 1; if (wt[m] <= t) a = m; else b = m; }
    return a;
  }

  function bakeBase() {
    base.width = bg.width; base.height = bg.height;
    var g = gBase; g.setTransform(DPR, 0, 0, DPR, 0, 0);
    var grad = g.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#161a1f"); grad.addColorStop(.6, "#0f1216"); grad.addColorStop(1, "#0a0d10");
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(255,255,255,.028)"; g.lineWidth = 1; g.beginPath();
    for (var x = 0; x < W; x += 40) { g.moveTo(x + .5, 0); g.lineTo(x + .5, H); }
    for (var y = 0; y < H; y += 40) { g.moveTo(0, y + .5); g.lineTo(W, y + .5); }
    g.stroke();
    // the steel sheet: slight sheen, fine rolling lines, a lit edge and a shadow under it
    var s = sheet;
    g.save(); g.shadowColor = "rgba(0,0,0,.7)"; g.shadowBlur = 26; g.shadowOffsetY = 10; g.fillStyle = "#23282e"; g.fillRect(s.x, s.y, s.w, s.h); g.restore();
    var m = g.createLinearGradient(s.x, s.y, s.x + s.w, s.y + s.h);
    m.addColorStop(0, "#2d333a"); m.addColorStop(.42, "#22272d"); m.addColorStop(.6, "#2a3037"); m.addColorStop(1, "#1d2126");
    g.fillStyle = m; g.fillRect(s.x, s.y, s.w, s.h);
    g.save(); g.beginPath(); g.rect(s.x, s.y, s.w, s.h); g.clip(); g.lineWidth = 1;
    for (var i = 0; i < 220; i++) {
      var ly = s.y + rnd(i + 40) * s.h, lx = s.x + rnd(i + 90) * s.w, ll = 40 + rnd(i + 140) * 260;
      g.strokeStyle = rnd(i + 200) > .5 ? "rgba(255,255,255,.018)" : "rgba(0,0,0,.05)";
      g.beginPath(); g.moveTo(lx, ly + .5); g.lineTo(lx + ll, ly + .5); g.stroke();
    }
    g.restore();
    g.strokeStyle = "rgba(255,255,255,.09)"; g.strokeRect(s.x + .5, s.y + .5, s.w - 1, s.h - 1);
  }
  function resetBg() { gb.setTransform(1, 0, 0, 1, 0, 0); gb.drawImage(base, 0, 0); gb.setTransform(DPR, 0, 0, DPR, 0, 0); bakedIdx = 0; ghostBaked = false; }

  function bakeGhosts() {
    gb.save(); gb.setLineDash([4, 3]); gb.lineWidth = .9; gb.strokeStyle = "rgba(186,204,222,.42)";
    cells.forEach(function (c) { gb.save(); gb.translate(c.x, c.y); gb.scale(u, u); gb.lineWidth = .9 / u; gb.setLineDash([4 / u, 3 / u]); gb.stroke(PART_PATH); gb.restore(); });
    gb.restore(); ghostBaked = true;
  }
  function bakeCuts(a, b) { // finished, cooled cuts: faint heat tint, then the dark kerf with a lit lower edge
    var p = new Path2D();
    for (var i = a; i < b; i++) if (won[i]) { p.moveTo(wx[i - 1], wy[i - 1]); p.lineTo(wx[i], wy[i]); }
    gb.save(); gb.lineCap = "round"; gb.lineJoin = "round";
    gb.strokeStyle = "rgba(112,126,160,.10)"; gb.lineWidth = 6.5; gb.stroke(p);
    gb.strokeStyle = "rgba(170,132,86,.13)"; gb.lineWidth = 3.6; gb.stroke(p);
    gb.translate(0, .9); gb.strokeStyle = "rgba(255,255,255,.2)"; gb.lineWidth = 1.5; gb.stroke(p); gb.translate(0, -.9);
    gb.strokeStyle = "#07090b"; gb.lineWidth = 1.7; gb.stroke(p);
    gb.restore();
  }

  function layout() {
    if (laser.hidden) { dirty = true; return; }
    dirty = false;
    var head = document.querySelector(".site-head");
    root.style.setProperty("--hs-head", (head ? head.offsetHeight : 72) + "px");
    var r = laser.getBoundingClientRect(), wide = wideQuery.matches;
    W = r.width; H = r.height; DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    bg.width = fx.width = Math.round(W * DPR); bg.height = fx.height = Math.round(H * DPR);
    gx.setTransform(DPR, 0, 0, DPR, 0, 0); gb.setTransform(DPR, 0, 0, DPR, 0, 0);

    var ib = intro.getBoundingClientRect();
    if (wide) { var mg = Math.max(28, (W - 1120) / 2 * .35); sx = ib.right - r.left + 34; sy = 22; sw = W - mg - sx; sh = H - 42; }
    else { sx = 16; sy = ib.bottom - r.top + 8; sw = W - 32; sh = H - sy - 50; }
    scene.style.left = sx + "px"; scene.style.top = sy + "px"; scene.style.width = sw + "px"; scene.style.height = sh + "px";

    // Clear every moved piece so the measurements below are of its resting place
    [card, mail, file, cursor].concat(KEYS.map(function (k) { return pills[k]; })).forEach(function (el) { el._t = el._o = el._v = undefined; el.style.visibility = ""; });
    KEYS.forEach(function (k) { txt(slots[k], FINAL[k]); slots[k]._v = tslots[k]._v = undefined; slots[k].style.visibility = tslots[k].style.visibility = ""; });
    card.style.transform = "translate(-50%,-50%)";

    var stripH = strip.offsetHeight, noteH = 16, rx = sx, ry = sy + stripH + 10, rw = sw, rh = sh - stripH - 10 - noteH, pad = 12;
    var options = [[3, 2], [2, 3]], best = 0;
    options.forEach(function (o) {
      var uu = Math.min((rw - 2 * pad) / (o[0] * 160 + (o[0] - 1) * GAP), (rh - 2 * pad) / (o[1] * 100 + (o[1] - 1) * GAP));
      if (uu > best + .001) { best = uu; cols = o[0]; rowsN = o[1]; }
    });
    u = Math.min(best, 2.2); sf = Math.max(.65, Math.min(1.25, u / 1.4));
    var nw = (cols * 160 + (cols - 1) * GAP) * u, nh = (rowsN * 100 + (rowsN - 1) * GAP) * u;
    sheet = { x: rx, y: ry, w: rw, h: rh, nx: rx + (rw - nw) / 2, ny: ry + (rh - nh) / 2 };
    buildPath(); bakeBase(); resetBg();

    mail.style.left = (sheet.x - sx + sheet.w / 2) + "px"; mail.style.top = (sheet.y - sy + sheet.h / 2) + "px";
    mail.style.transform = "translate(-50%,-50%)";

    KEYS.forEach(function (k) {
      var a = rel(slots[k]), b = rel(tslots[k]), fa = parseFloat(getComputedStyle(slots[k]).fontSize), fb = parseFloat(getComputedStyle(tslots[k]).fontSize);
      pills[k].style.fontSize = fa + "px";
      from[k] = { ax: a.x - 7, ay: a.y, bx: b.x - 7 * fb / fa, by: b.y, s: fb / fa };
    });
    var d = rel(drawing), pu = Math.min(d.w / 172, d.h / 112);
    pv = { x: sx + d.x + (d.w - 172 * pu) / 2 + 6 * pu, y: sy + d.y + (d.h - 112 * pu) / 2 + 6 * pu, u: pu };

    var dr = rel(drop), bs = rel(send), ba = rel(approve), fr = rel(file);
    fileA = { x: sw - fr.w - (wide ? 18 : 6), y: sh - fr.h - (wide ? 34 : 24) };
    fileB = { x: dr.x + dr.w / 2 - fr.w / 2, y: dr.y + dr.h / 2 - fr.h / 2 };
    var cx = function (o) { return o.x + o.w * .72; }, cy = function (o) { return o.y + o.h * .55; };
    keysCursor = [
      [.15, sw + 30, sh + 10], [.55, fileA.x + fr.w * .7, fileA.y + fr.h * .6], [DRAG0, fileA.x + fr.w * .7, fileA.y + fr.h * .6],
      [DRAG1, fileB.x + fr.w * .7, fileB.y + fr.h * .6], [2.95, fileB.x + fr.w * .7, fileB.y + fr.h * .6],
      [CLICK1 - .05, cx(bs), cy(bs)], [4.35, cx(bs), cy(bs)], [CLICK2 - .05, cx(ba), cy(ba)], [6.3, cx(ba), cy(ba)]
    ];
    render(now);
  }

  // ---- Frame parts
  function drawStory(t) {
    var on = t < DROP1 ? 0 : t < FLY0 + .5 ? 1 : t < MAIL1 ? 2 : 3;
    story.forEach(function (li, i) {
      cls(li, "is-on", i === on);
      cls(li, "is-done", i < on || t >= END);
    });
  }

  function drawUi(t) {
    // the calculator card
    var a = span(t, 0, .4) * (1 - span(t, FLY0, FLY0 + .4));
    var cardOn = a > 0.001;
    vis(card, cardOn);
    if (cardOn) {
      op(card, a);
      var y = (1 - out(span(t, 0, .5))) * 16 - span(t, FLY0, FLY0 + .4) * 10, s = 1 - span(t, FLY0, FLY0 + .4) * .03;
      tf(card, "translate(-50%,calc(-50% + " + y.toFixed(1) + "px)) scale(" + s.toFixed(3) + ")");
      cls(drop, "is-over", t >= DRAG1 - .35 && t < DROP1 + .05);
      op(prompt, 1 - span(t, DRAG1 - .1, DROP1));
      var dq = ease(span(t, DROP1 - .05, DRAW1)), off = (1.02 * (1 - dq)).toFixed(3);
      for (var i = 0; i < drawParts.length; i++) if (drawParts[i]._d !== off) { drawParts[i]._d = off; drawParts[i].style.strokeDashoffset = off; }
      op(fname, span(t, DROP1, DROP1 + .25));
      rows.forEach(function (row, k) { op(row, span(t, 1.75 + k * .13, 1.95 + k * .13)); });
      var cq = ease(span(t, 2.1, 2.6)), pq = ease(span(t, PRICE0, PRICE1));
      txt(slots.cut, fmtCut(CUT_M * cq)); txt(slots.pierce, String(Math.round(PIERCES * cq))); txt(slots.price, fmtPrice(GROSS * pq));
      var press = span(t, CLICK1, CLICK1 + .06) * (1 - span(t, CLICK1 + .06, CLICK1 + .16));
      tf(send, "scale(" + (1 - press * .04).toFixed(3) + ")");
      cls(send, "is-done", t >= CLICK1 + .08);
    }
    KEYS.forEach(function (k, i) { vis(slots[k], t < FLY0 + i * .07); });

    // the figures moving aside
    KEYS.forEach(function (k, i) {
      var t0 = FLY0 + i * .07, q1 = span(t, t0, t0 + FLY_LEN), f = from[k], p = pills[k];
      if (q1 <= 0 || q1 >= 1) { vis(p, false); }
      else {
        vis(p, true);
        var e = ease(q1), x = lerp(f.ax, f.bx, e), y2 = lerp(f.ay, f.by, e) - Math.sin(e * 3.1416) * 18, sc = lerp(1, f.s, e);
        tf(p, "translate3d(" + x.toFixed(1) + "px," + y2.toFixed(1) + "px,0) scale(" + sc.toFixed(3) + ")");
        op(p, span(q1, 0, .08) * (1 - span(q1, .86, 1)));
      }
      vis(tslots[k], q1 >= .9);
    });

    // the running figures on the tiles
    var st = span(t, FLY0 + .05, FLY0 + .45);
    op(strip, st); vis(strip, st > 0.001);
    tf(strip, "translateY(" + ((1 - out(st)) * -8).toFixed(1) + "px)");
    var i2 = idxAt(t), f2 = i2 + 1 < wn ? clamp((t - wt[i2]) / (wt[i2 + 1] - wt[i2] || 1)) : 1;
    var len = i2 + 1 < wn ? lerp(wl[i2], wl[i2 + 1], f2) : wl[i2], pr = len / lenTotal, done = t >= CUT1;
    if (t < CUT0) { pr = 0; }
    var pc = t < CUT0 ? 0 : wp[i2];
    txt(nows.cut, fmtCut(done ? CUT_M : CUT_M * pr)); txt(nows.pierce, String(done ? PIERCES : pc)); txt(nows.price, fmtPrice(done ? GROSS : GROSS * pr));
    tf(bars.cut, "scaleX(" + pr.toFixed(4) + ")"); tf(bars.pierce, "scaleX(" + (pc / PIERCES).toFixed(4) + ")"); tf(bars.price, "scaleX(" + pr.toFixed(4) + ")");
    KEYS.forEach(function (k, i) { cls(tiles[k], "is-match", t >= CUT1 + i * .14); });
    cls(tiles.price, "is-approved", t >= CLICK2 + .1);

    // the shop's e-mail
    var ma = span(t, MAIL0, MAIL0 + .3) * (1 - span(t, MAIL1, MAIL1 + .3));
    vis(mail, ma > 0.001);
    if (ma > 0.001) {
      op(mail, ma);
      var my = (1 - out(span(t, MAIL0, MAIL0 + .35))) * 22 - span(t, MAIL1, MAIL1 + .3) * 14;
      tf(mail, "translate(-50%,calc(-50% + " + my.toFixed(1) + "px))");
      var pr2 = span(t, CLICK2, CLICK2 + .06) * (1 - span(t, CLICK2 + .06, CLICK2 + .16));
      tf(approve, "scale(" + (1 - pr2 * .04).toFixed(3) + ")");
      cls(approve, "is-done", t >= CLICK2 + .08);
    }

    // the file being dragged in
    var fa2 = span(t, .3, .5) * (1 - span(t, DRAG1 + .02, DROP1 - .02));
    vis(file, fa2 > 0.001);
    if (fa2 > 0.001) {
      op(file, fa2);
      var dg = ease(span(t, DRAG0, DRAG1)), lift = (1 - span(t, DRAG1, DROP1)) * 1;
      tf(file, "translate3d(" + lerp(fileA.x, fileB.x, dg).toFixed(1) + "px," + lerp(fileA.y, fileB.y, dg).toFixed(1) + "px,0) scale(" + (.8 + lift * .2).toFixed(3) + ")");
    }

    // the pointer
    var ca = span(t, .12, .3) * (1 - span(t, 6.1, 6.3));
    vis(cursor, ca > 0.001);
    if (ca > 0.001) {
      op(cursor, ca);
      var k0 = keysCursor[0], k1 = keysCursor[keysCursor.length - 1];
      for (var c = 0; c < keysCursor.length - 1; c++) if (t >= keysCursor[c][0] && t <= keysCursor[c + 1][0]) { k0 = keysCursor[c]; k1 = keysCursor[c + 1]; break; }
      var m2 = ease(span(t, k0[0], k1[0]));
      var push = Math.max(span(t, CLICK1, CLICK1 + .06) * (1 - span(t, CLICK1 + .06, CLICK1 + .16)), span(t, CLICK2, CLICK2 + .06) * (1 - span(t, CLICK2 + .06, CLICK2 + .16)));
      tf(cursor, "translate3d(" + lerp(k0[1], k1[1], m2).toFixed(1) + "px," + lerp(k0[2], k1[2], m2).toFixed(1) + "px,0) scale(" + (1 - push * .14).toFixed(3) + ")");
    }

    op(note, span(t, 0, .4));
    tf(steps[0].querySelector("i"), "scaleX(" + span(t, 0, autoOn ? AUTO : END).toFixed(4) + ")");
  }

  // Heat of the cut by age in seconds: white, yellow, orange, red, dull red, brown, then the baked dark kerf.
  var AGES = [.05, .13, .27, .5, .85, 1.3, 1.9, HOT];
  var HEAT = ["#fff8e6", "#ffe39a", "#ffb43f", "#ff7f1c", "#ec4c10", "#ac2c0b", "#611d0d", "#2f1d15"];
  var CORE = [2.5, 2.4, 2.2, 2, 1.9, 1.8, 1.7, 1.7];
  var HALO = [["rgba(255,176,90,.34)", 9], ["rgba(255,150,64,.30)", 9], ["rgba(255,120,40,.26)", 8.5], ["rgba(255,92,24,.20)", 8], ["rgba(235,62,14,.14)", 7], ["rgba(170,40,10,.09)", 6]];
  var BANDS = ["#fff4d0", "#ffd76e", "#ffa43f", "#ff6f22", "#b53c12"];
  var BANDW = [1.7, 1.5, 1.3, 1.1, .9];

  function drawCanvas(t) {
    gx.clearRect(0, 0, W, H);

    // bg: bring what is finished up to date; going back in time starts it over
    var iNow = idxAt(t), cooled = t < CUT0 ? 0 : idxAt(t - HOT) + 1;
    if (t < CUT0 + HOT) cooled = 0;
    if (cooled < bakedIdx || (ghostBaked && t < GHOST1)) resetBg();
    if (t >= GHOST1 && !ghostBaked) bakeGhosts();
    // in small batches, so the big canvas is not touched on every frame
    if (cooled - bakedIdx > 40 || (t >= CUT1 + HOT && cooled > bakedIdx)) { bakeCuts(Math.max(1, bakedIdx), cooled); bakedIdx = cooled; }

    if (t >= GHOST0 && t < GHOST1) { // the drawing leaves the card and lands on the sheet, one copy per piece
      gx.lineJoin = "round"; gx.strokeStyle = "rgba(205,222,240,.8)";
      cells.forEach(function (c, i) {
        var q2 = out(span(t, GHOST0 + i * .05, GHOST0 + i * .05 + .62));
        if (q2 <= 0) return;
        var s = lerp(pv.u, u, q2);
        gx.save(); gx.globalAlpha = .35 + q2 * .5; gx.translate(lerp(pv.x, c.x, q2), lerp(pv.y, c.y, q2)); gx.scale(s, s); gx.lineWidth = 1 / s; gx.stroke(PART_PATH); gx.restore();
      });
    }

    if (t < CUT0 - .45 || t > COOLED) return;

    // the hot part of the cut
    if (t >= CUT0) {
      var paths = [], b, last = Math.min(iNow, wn - 1);
      for (b = 0; b < HEAT.length; b++) paths.push(null);
      for (var i = Math.max(1, bakedIdx); i <= last; i++) {
        if (!won[i]) continue;
        var age = t - wt[i];
        b = 0; while (b < AGES.length - 1 && age > AGES[b]) b++;
        var p = paths[b] || (paths[b] = new Path2D());
        p.moveTo(wx[i - 1], wy[i - 1]); p.lineTo(wx[i], wy[i]);
      }
      gx.lineCap = gx.lineJoin = "round";
      if (!low) {
        gx.globalCompositeOperation = "lighter";
        for (b = 0; b < HALO.length; b++) if (paths[b]) { gx.strokeStyle = HALO[b][0]; gx.lineWidth = HALO[b][1] * sf; gx.stroke(paths[b]); }
        gx.globalCompositeOperation = "source-over";
      }
      for (b = HEAT.length - 1; b >= 0; b--) if (paths[b]) { gx.strokeStyle = HEAT[b]; gx.lineWidth = CORE[b]; gx.stroke(paths[b]); }
    }

    // sparks
    if (t >= CUT0 && t < CUT1 + .8) {
      var bands = [null, null, null, null, null], lo = 0, hi = spCount;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (sparks[mid].b < t - .72) lo = mid + 1; else hi = mid; }
      var skip = low ? 2 : 1;
      for (var n = lo; n < spCount; n += skip) {
        var s2 = sparks[n], ag = t - s2.b;
        if (ag < 0) break;
        if (ag > s2.l) continue;
        var fd = ag / s2.l, bd = fd * 5 | 0, x = s2.x + s2.vx * ag, y = s2.y + s2.vy * ag + 500 * sf * ag * ag;
        var pb = bands[bd] || (bands[bd] = new Path2D());
        pb.moveTo(x, y); pb.lineTo(x - s2.vx * .012, y - (s2.vy + 1000 * sf * ag) * .012);
      }
      gx.lineCap = "round";
      for (var bi = 0; bi < 5; bi++) if (bands[bi]) { gx.strokeStyle = BANDS[bi]; gx.lineWidth = BANDW[bi]; gx.stroke(bands[bi]); }
    }

    // the machine
    var inq = ease(span(t, CUT0 - .45, CUT0)), awayq = ease(span(t, CUT1 + .05, CUT1 + .55));
    if (awayq >= 1) return;
    var i3 = iNow, f3 = i3 + 1 < wn ? clamp((t - wt[i3]) / (wt[i3 + 1] - wt[i3] || 1)) : 1;
    var hx = i3 + 1 < wn ? lerp(wx[i3], wx[i3 + 1], f3) : wx[i3], hy = i3 + 1 < wn ? lerp(wy[i3], wy[i3 + 1], f3) : wy[i3];
    var firing = t >= CUT0 && t < CUT1 && i3 + 1 < wn && won[i3 + 1] === 1, piercing = t >= CUT0 && t < CUT1 && i3 + 1 < wn && !won[i3 + 1] && wp[i3] > (i3 ? wp[i3 - 1] : 0);
    var gxx = t < CUT0 ? lerp(W + 40, hx, inq) : lerp(hx, W + 40, awayq);

    if (firing && !low) { // a little smoke drifting off behind the head
      for (var k = 1; k <= 5; k++) {
        var tk = t - k * .14, ik = idxAt(tk), sz = (14 + k * 8) * sf;
        gx.globalAlpha = (.5 - k * .07);
        gx.drawImage(SMOKE, wx[ik] + k * 2 - sz / 2, wy[ik] - k * 7 * sf - sz / 2, sz, sz);
      }
      gx.globalAlpha = 1;
    }
    var by = sheet.y - 8, bh = sheet.h + 16; // the bridge spans the sheet, not the texts around it
    gx.fillStyle = "rgba(150,162,175,.13)"; gx.fillRect(gxx - 8, by, 16, bh);
    gx.fillStyle = "rgba(190,200,210,.32)"; gx.fillRect(gxx - 8, by, 1, bh); gx.fillRect(gxx + 7, by, 1, bh);
    gx.fillStyle = "#3a434d"; gx.fillRect(gxx - 15 * sf, hy - 24 * sf, 30 * sf, 21 * sf);
    gx.fillStyle = "#5c6671"; gx.fillRect(gxx - 6 * sf, hy - 7 * sf, 12 * sf, 6 * sf);
    if (firing || piercing) {
      var fl = 1 + Math.sin(t * 97) * .08 + Math.sin(t * 211) * .06, gs = (piercing ? 82 : 58) * sf * fl;
      gx.globalCompositeOperation = "lighter";
      gx.drawImage(GLARE, gxx - gs / 2, hy - gs / 2, gs, gs);
      gx.globalCompositeOperation = "source-over";
    }
  }

  var autoOn = !calm;
  function render(t) {
    if (!sheet) return;
    drawStory(t);
    drawUi(t);
    drawCanvas(t);
    root.dataset.t = t.toFixed(2);
  }

  // ---- Playback
  var raf = 0, last = 0, now = 0, speed = 1, running = false, inView = true, holdPaused = false, slow = 0, frames = 0;
  function tick(ts) {
    raf = 0;
    if (!running) return;
    var real = ts - last; last = ts;
    if (now >= CUT0 && now < CUT1 && !low) { // a machine that cannot keep up gets fewer sparks and no halo
      frames++; slow += real;
      if (frames >= 45) { if (slow / frames > 27) low = true; frames = 0; slow = 0; }
    }
    if (!(holdPaused && now >= END)) now += Math.min(.05, real / 1000) * speed;
    render(now);
    if (autoOn && now >= AUTO) { showAudit(); return; }
    if (!autoOn && now >= COOLED) { running = false; return; }
    kick();
  }
  function kick() { if (running && inView && !raf) { raf = requestAnimationFrame(tick); } }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  function play(from2, sp) {
    stop(); now = from2; speed = sp;
    if (calm) { now = COOLED; render(now); return; }
    running = true; last = performance.now(); kick();
  }

  function markStep(n) {
    root.dataset.current = n;
    steps.forEach(function (b, i) { if (i === n - 1) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
    tf(steps[1].querySelector("i"), n === 2 ? "scaleX(1)" : "scaleX(0)");
    if (n === 2) tf(steps[0].querySelector("i"), "scaleX(1)");
  }
  function showLaser() {
    audit.hidden = true; laser.hidden = false; laser.classList.remove("is-out");
    markStep(1);
    if (dirty) layout();
  }
  var outTimer = 0;
  function showAudit() {
    stop(); markStep(2);
    clearTimeout(outTimer);
    if (calm) { laser.hidden = true; audit.hidden = false; return; }
    laser.classList.add("is-out");
    outTimer = setTimeout(function () { laser.hidden = true; audit.hidden = false; }, 280);
  }

  root.classList.add("hs--js");
  audit.hidden = true;
  markStep(1);

  // Stepping by hand ends the automatic move: the visitor is in charge from then on.
  steps[0].addEventListener("click", function () { clearTimeout(outTimer); autoOn = false; showLaser(); play(0, 1); });
  steps[1].addEventListener("click", function () { autoOn = false; showAudit(); });
  root.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") steps[1].click();
    if (e.key === "ArrowLeft") steps[0].click();
  });
  var startX = null;
  root.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
  root.addEventListener("touchend", function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX; startX = null;
    if (Math.abs(dx) > 60) steps[dx < 0 ? 1 : 0].click();
  }, { passive: true });
  // While someone reads the finished scene, it does not move on.
  laser.addEventListener("mouseenter", function () { holdPaused = true; });
  laser.addEventListener("mouseleave", function () { holdPaused = false; });
  laser.addEventListener("focusin", function () { holdPaused = true; });
  laser.addEventListener("focusout", function () { holdPaused = false; });
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; if (inView) { last = performance.now(); kick(); } }).observe(laser);

  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var r = laser.getBoundingClientRect();
      if (laser.hidden) { dirty = true; return; }
      if (Math.abs(r.width - W) > 1 || Math.abs(r.height - H) > 1) layout();
    }, 140);
  });
  // For checking any single frame by hand; playback does not use these.
  root.hsSeek = function (t) { stop(); now = t; render(t); };
  root.hsPlay = function (from2, sp) { calm = false; play(from2 || 0, sp || 1); };

  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { layout(); play(0, 1); });
})();
