// Home page scene "The cut": the laser cuts a part, its back carries the quote, the part bursts into messy data and
// the data snaps into the audit table. Every frame is a pure function of the time t, so any moment can be replayed.
(function () {
  var root = document.querySelector("[data-hs]");
  if (!root) return;
  var stage = root.querySelector(".hs__stage");
  var laser = root.querySelector(".hs__slide--laser");
  var audit = root.querySelector(".hs__slide--audit");
  var intro = laser.querySelector(".hs__intro");
  var auditText = audit.querySelector(".hero__text");
  var auditFig = audit.querySelector(".readout");
  var steps = root.querySelectorAll(".hs__step");
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hu = (navigator.language || "").slice(0, 2).toLowerCase() === "hu";

  if (hu) {
    root.classList.add("hs--hu");
    root.querySelectorAll("[data-hu-href]").forEach(function (a) { a.href = a.dataset.huHref; });
    steps.forEach(function (b) { b.querySelector("span").textContent = b.dataset.hu; });
  }
  var TXT = hu
    ? { cut: "Vágáshossz", pierce: "Beszúrás", job: "Szénacél, 3 mm · 25 db", price: "18 898 Ft", note: "bruttó, tájékoztató ár", ok: "Jóváhagyás", stamp: "JÓVÁHAGYVA", m: "m" }
    : { cut: "Cut length", pierce: "Pierces", job: "Mild steel, 3 mm · 25 pcs", price: "HUF 18,898", note: "gross, indicative", ok: "Approve", stamp: "APPROVED", m: "m" };
  var TOKENS = ["12,500.00", "DXF", "IBAN", "MT940", "0.719", "EUR", "CAMT", "189.95", "2,500.00", "SEPA", "14,810.05", "NACHA", "3 mm", "BAI2", "DWG", "#N/A", "CSV", "01/11", "Σ", "?", "0.00", "XML", "HUF", "ERR", "PDF", "25"];
  var END = 10.3, MONO = '"Plex Mono", ui-monospace, monospace', SANS = '"Plex Sans", system-ui, sans-serif';

  var canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  stage.insertBefore(canvas, stage.firstChild);
  var ctx = canvas.getContext("2d");
  var W = 0, H = 0, part = null, rows = [], pts = [], parts = [], sparks = [];

  function rnd(seed) { var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function span(t, a, b) { return clamp((t - a) / (b - a)); }
  function ease(v) { return v * v * (3 - 2 * v); }
  function out(v) { return 1 - Math.pow(1 - v, 3); }

  // The bracket in millimetres, in cutting order: inner contours first, as a real machine does.
  function circle(cx, cy, r) { var a = []; for (var i = 0; i <= 28; i++) a.push([cx + r * Math.cos(i / 28 * 6.2832), cy + r * Math.sin(i / 28 * 6.2832)]); return a; }
  function slot() {
    var a = [[65, 60], [95, 60]], i;
    for (i = 1; i <= 14; i++) a.push([95 + 10 * Math.sin(i / 14 * 3.1416), 50 + 10 * Math.cos(i / 14 * 3.1416)]);
    a.push([65, 40]);
    for (i = 1; i <= 14; i++) a.push([65 - 10 * Math.sin(i / 14 * 3.1416), 50 - 10 * Math.cos(i / 14 * 3.1416)]);
    return a;
  }
  function outline() {
    var a = [[0, 100], [160, 100], [160, 20]];
    for (var i = 1; i <= 14; i++) a.push([140 + 20 * Math.cos(i / 14 * 1.5708), 20 - 20 * Math.sin(i / 14 * 1.5708)]);
    a.push([0, 0], [0, 100]);
    return a;
  }
  var SHAPES = [circle(20, 20, 4.5), circle(20, 80, 4.5), circle(140, 80, 4.5), slot(), outline()];
  var HOLES = 4;
  var LEN = [], TOTAL = 0;
  SHAPES.forEach(function (s) { for (var i = 1; i < s.length; i++) { var l = Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]); LEN.push(l); TOTAL += l; } });

  function pointAt(p) { // position along the whole cut, p in 0..1
    var left = p * TOTAL, k = 0;
    for (var s = 0; s < SHAPES.length; s++) for (var i = 1; i < SHAPES[s].length; i++, k++) {
      if (left <= LEN[k]) { var f = LEN[k] ? left / LEN[k] : 0, a = SHAPES[s][i - 1], b = SHAPES[s][i]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }
      left -= LEN[k];
    }
    return SHAPES[4][0];
  }
  function toX(mm) { return part.x + mm * part.u; }
  function toY(mm) { return part.y + mm * part.u; }

  function layout() {
    var r = stage.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var ib = intro.getBoundingClientRect(), wide = W >= 860, x0, y0, x1, y1;
    if (wide) { x0 = ib.right - r.left + 32; y0 = 28; x1 = W - 40; y1 = H - 52; }
    else { x0 = 16; y0 = ib.bottom - r.top + 18; x1 = W - 16; y1 = H - 56; }
    var u = Math.min((x1 - x0) / 160, (y1 - y0) / 100) * .9;  // room for the part to rise
    part = { u: u, x: x0 + (x1 - x0 - 160 * u) / 2, y: y0 + (y1 - y0 - 100 * u) / 2 };
    part.cx = part.x + 80 * u; part.cy = part.y + 50 * u;

    rows = [];
    audit.querySelectorAll(".readout__head, .readout__rows > div, .readout__verdict").forEach(function (el) { var b = el.getBoundingClientRect(); rows.push({ x: b.left - r.left + 14, w: Math.max(40, b.width - 90), y: b.top - r.top + b.height / 2 }); });
    var n = W < 700 ? 120 : 280;
    parts = [];
    for (var i = 0; i < n; i++) {
      var row = rows[i % rows.length];
      parts.push({
        s: TOKENS[i % TOKENS.length], size: 10 + rnd(i) * 7,
        ox: part.x + rnd(i + 1) * 160 * u, oy: part.y + rnd(i + 2) * 100 * u,
        sx: rnd(i + 3) * W, sy: rnd(i + 4) * H, spin: (rnd(i + 5) - .5) * 5, phase: rnd(i + 6) * 6.28,
        tx: row.x + rnd(i + 7) * row.w, ty: row.y, delay: rnd(i + 8) * .4
      });
    }
    sparks = [];
    var m = W < 700 ? 240 : 520;
    for (var j = 0; j < m; j++) sparks.push({ b: rnd(j + 11), vx: (rnd(j + 12) - .5) * 300, vy: -60 - rnd(j + 13) * 260, life: .25 + rnd(j + 14) * .55 });
  }

  function partPath(withHoles) {
    var p = new Path2D();
    SHAPES.forEach(function (s, idx) {
      if (idx < HOLES && !withHoles) return;
      s.forEach(function (q, i) { var x = (q[0] - 80) * part.u, y = (q[1] - 50) * part.u; if (i) p.lineTo(x, y); else p.moveTo(x, y); });
      p.closePath();
    });
    return p;
  }

  function drawBed(t) {
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#1a1f25"); g.addColorStop(.55, "#11151a"); g.addColorStop(1, "#0b0e12");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,.035)"; ctx.lineWidth = 1;
    for (var x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); ctx.stroke(); }
    for (var y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); ctx.stroke(); }
    var sw = span(t, .1, 1.3);
    if (sw > 0 && sw < 1) { // light running over the sheet as it wakes up
      var c = -300 + sw * (W + 600), s = ctx.createLinearGradient(c - 220, 0, c + 220, H * .3);
      s.addColorStop(0, "rgba(255,255,255,0)"); s.addColorStop(.5, "rgba(255,255,255,.10)"); s.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = s; ctx.fillRect(0, 0, W, H);
    }
  }

  function drawCut(t, p) {
    var drawn = p * TOTAL, k = 0, cool = span(t, 3.3, 5);
    ctx.lineJoin = ctx.lineCap = "round";
    for (var s = 0; s < SHAPES.length; s++) for (var i = 1; i < SHAPES[s].length; i++, k++) {
      if (drawn <= 0) return;
      var a = SHAPES[s][i - 1], b = SHAPES[s][i], f = Math.min(1, drawn / (LEN[k] || 1));
      var age = (p * TOTAL - drawn) / (TOTAL * .16) + cool * 3, heat = clamp(1 - age);
      ctx.strokeStyle = heat > 0 ? "rgb(255," + Math.round(150 + 60 * (1 - heat)) + "," + Math.round(70 + 130 * (1 - heat)) + ")" : "#8a939d";
      ctx.lineWidth = 1.2 + heat * 1.4;
      ctx.shadowColor = "#ff7a30"; ctx.shadowBlur = heat * 14;
      ctx.beginPath(); ctx.moveTo(toX(a[0]), toY(a[1])); ctx.lineTo(toX(a[0] + (b[0] - a[0]) * f), toY(a[1] + (b[1] - a[1]) * f)); ctx.stroke();
      drawn -= LEN[k];
    }
    ctx.shadowBlur = 0;
  }

  function drawMachine(t, p) {
    var inn = ease(span(t, 0, .8)), away = ease(span(t, 3.5, 4.1)), q = pointAt(p);
    var hx = t < .8 ? W + 60 - inn * (W + 60 - toX(q[0])) : toX(q[0]) + away * (W - toX(q[0]) + 80), hy = toY(q[1]);
    ctx.fillStyle = "rgba(190,200,210,.13)"; ctx.fillRect(hx - 7, 0, 14, H);
    ctx.strokeStyle = "rgba(190,200,210,.35)"; ctx.lineWidth = 1; ctx.strokeRect(hx - 7.5, -2, 15, H + 4);
    ctx.fillStyle = "#39424c"; ctx.fillRect(hx - 15, hy - 22, 30, 20);
    ctx.fillStyle = "#59636e"; ctx.fillRect(hx - 6, hy - 6, 12, 5);
    if (t >= .8 && t < 3.5) {
      var g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 34);
      g.addColorStop(0, "rgba(255,240,215,1)"); g.addColorStop(.18, "rgba(255,150,70,.75)"); g.addColorStop(1, "rgba(255,120,40,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, 34, 0, 6.2832); ctx.fill();
    }
  }

  function drawSparks(t) {
    ctx.lineCap = "round";
    sparks.forEach(function (s) {
      var born = .8 + s.b * 2.7, age = t - born;
      if (age < 0 || age > s.life) return;
      var q = pointAt(s.b), x0 = toX(q[0]), y0 = toY(q[1]), x = x0 + s.vx * age, y = y0 + s.vy * age + 520 * age * age, fade = 1 - age / s.life;
      ctx.strokeStyle = "rgba(255," + Math.round(170 + 70 * fade) + "," + Math.round(90 * fade) + "," + fade + ")";
      ctx.lineWidth = 1 + fade;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s.vx * .012, y - (s.vy + 1040 * age) * .012); ctx.stroke();
    });
  }

  function drawFacts(t, p) {
    var a = span(t, .9, 1.3) * (1 - span(t, 3.6, 4));
    if (a <= 0) return;
    var pierce = Math.min(5, Math.floor(p * TOTAL / (TOTAL / 40)) + 1);
    if (p > 0) { var acc = 0, k = 0, n = 0; for (var s = 0; s < SHAPES.length; s++) { if (p * TOTAL >= acc) n = s + 1; for (var i = 1; i < SHAPES[s].length; i++, k++) acc += LEN[k]; } pierce = n; }
    var cut = (0.719 * p).toFixed(3); if (hu) cut = cut.replace(".", ",");
    ctx.globalAlpha = a;
    ctx.font = "500 12px " + MONO; ctx.fillStyle = "#aeb6c0"; ctx.textAlign = "left";
    var y = Math.min(H - 16, part.y + 100 * part.u + 22);
    ctx.fillText(TXT.cut + "  ", part.x, y);
    var w = ctx.measureText(TXT.cut + "  ").width;
    ctx.fillStyle = "#ff8a4c"; ctx.fillText(cut + " " + TXT.m, part.x + w, y);
    ctx.fillStyle = "#aeb6c0"; ctx.textAlign = "right"; ctx.fillText(TXT.pierce + "  " + pierce, part.x + 160 * part.u, y);
    ctx.textAlign = "left"; ctx.globalAlpha = 1;
  }

  function drawPart(t) {
    var lift = ease(span(t, 3.5, 4.1)), flip = ease(span(t, 4.1, 5)), gone = span(t, 7, 7.25);
    if (lift <= 0 || gone >= 1) return;
    var a = flip * Math.PI, c = Math.cos(a), k = 1 + lift * .1, front = c >= 0, sx = Math.max(.012, Math.abs(c)) * k;
    // the hole left in the sheet
    ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.save(); ctx.translate(part.cx, part.cy); ctx.fill(partPath(false)); ctx.restore();
    ctx.save();
    ctx.globalAlpha = 1 - gone;
    ctx.shadowColor = "rgba(0,0,0,.65)"; ctx.shadowBlur = 8 + lift * 34; ctx.shadowOffsetY = 4 + lift * 18;
    ctx.translate(part.cx, part.cy - lift * 8); ctx.scale(sx, k + Math.abs(Math.sin(a)) * .03);
    var g = ctx.createLinearGradient(-80 * part.u, -50 * part.u, 80 * part.u, 50 * part.u);
    var sheen = .5 + .5 * Math.sin(a * 2 + 1);
    g.addColorStop(0, "#aeb7c0"); g.addColorStop(.25 + sheen * .4, "#e6ebef"); g.addColorStop(1, "#808a94");
    ctx.fillStyle = g;
    var path = partPath(true);
    ctx.fill(path, "evenodd");
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1 / Math.max(sx, .2); ctx.stroke(path);
    if (!front) drawQuote(t);
    ctx.restore();
  }

  function buttonRect() { var u = part.u; return { x: -46 * u, y: 16 * u, w: 92 * u, h: 17 * u }; }
  function drawQuote(t) {
    var u = part.u, x = -50 * u, y = -38 * u, w = 100 * u, h = 76 * u;
    ctx.fillStyle = "#fbfbf9";
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.fill();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#565c66"; ctx.font = "500 " + Math.max(9, 5.6 * u) + "px " + SANS; ctx.fillText(TXT.job, 0, -29 * u);
    ctx.fillStyle = "#15171b"; ctx.font = "600 " + Math.max(16, 13.5 * u) + "px " + SANS; ctx.fillText(TXT.price, 0, -13 * u);
    ctx.fillStyle = "#7d838c"; ctx.font = Math.max(8, 4.6 * u) + "px " + SANS; if (t < 6.25) ctx.fillText(TXT.note, 0, 2 * u);
    var b = buttonRect(), press = span(t, 6.1, 6.2) * (1 - span(t, 6.2, 6.35));
    ctx.fillStyle = t > 6.1 ? "#15803d" : "#c2410c";
    ctx.fillRect(b.x, b.y + press * 1.5, b.w, b.h);
    ctx.fillStyle = "#fff"; ctx.font = "600 " + Math.max(10, 6.2 * u) + "px " + SANS; ctx.fillText(TXT.ok, 0, b.y + b.h / 2 + press * 1.5);
    var st = span(t, 6.25, 6.5);
    if (st > 0) {
      ctx.save();
      ctx.translate(0, 5 * u); ctx.rotate(-.05); var s = 1.8 - out(st) * .8; ctx.scale(s, s); ctx.globalAlpha = st;
      ctx.strokeStyle = ctx.fillStyle = "#15803d"; ctx.lineWidth = 2.5;
      ctx.font = "700 " + Math.max(11, 6.6 * u) + "px " + MONO;
      var tw = ctx.measureText(TXT.stamp).width + 18, th = Math.max(20, 11 * u);
      ctx.strokeRect(-tw / 2, -th / 2, tw, th); ctx.fillText(TXT.stamp, 0, 1);
      ctx.restore();
    }
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  }

  function drawCursor(t) {
    var a = span(t, 5.2, 5.4) * (1 - span(t, 6.7, 6.9));
    if (a <= 0) return;
    var b = buttonRect(), tx = part.cx + b.w * .22, ty = part.cy + b.y + b.h * .6, m = ease(span(t, 5.4, 6.05));
    var x = W + 10 + (tx - W - 10) * m, y = H + (ty - H) * m, s = 1 - span(t, 6.1, 6.15) * .15 + span(t, 6.2, 6.3) * .15;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(1.25 * s, 1.25 * s);
    ctx.fillStyle = "#fff"; ctx.strokeStyle = "#111"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 17); ctx.lineTo(4.5, 13); ctx.lineTo(8, 20); ctx.lineTo(10.5, 19); ctx.lineTo(7, 12.5); ctx.lineTo(13, 12.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawData(t) {
    if (t < 7) return;
    var fin = 1 - span(t, 9.8, 10.2);
    ctx.textBaseline = "middle"; ctx.textAlign = "left";
    parts.forEach(function (d) {
      var q = out(span(t, 7, 8.4)), sn = ease(span(t, 8.5 + d.delay, 9.5 + d.delay * .5));
      var swirl = (1 - sn) * q * 26, sx = d.ox + (d.sx - d.ox) * q + Math.sin(t * 2.2 + d.phase) * swirl, sy = d.oy + (d.sy - d.oy) * q + Math.cos(t * 1.8 + d.phase) * swirl;
      var x = sx + (d.tx - sx) * sn, y = sy + (d.ty - sy) * sn, rot = d.spin * (t - 7) * (1 - sn);
      ctx.save(); ctx.globalAlpha = fin * (.35 + .65 * Math.max(sn, 1 - q * .4)); ctx.translate(x, y); ctx.rotate(rot);
      ctx.fillStyle = sn > .95 ? "#ff8a4c" : d.size > 14 ? "#eef1f4" : "#ff9d63";
      ctx.font = (d.size + (11 - d.size) * sn) + "px " + MONO;
      ctx.fillText(d.s, 0, 0); ctx.restore();
    });
    ctx.textBaseline = "alphabetic";
  }

  function apply(t) {
    var fade = span(t, 6.9, 7.3), on2 = t >= 9;
    laser.style.opacity = 1 - fade;
    laser.inert = t >= 7; audit.inert = !on2;
    auditText.style.opacity = span(t, 9, 9.7);
    auditFig.style.opacity = span(t, 9.6, 10.1);
    canvas.style.display = t >= END ? "none" : "";
    root.classList.toggle("hs-flash", t >= 9.9);
    steps[0].querySelector("i").style.width = Math.round(span(t, 0, END) * 100) + "%";
    steps[1].querySelector("i").style.width = t >= END ? "100%" : "0";
    if (on2) { steps[1].setAttribute("aria-current", "true"); steps[0].removeAttribute("aria-current"); }
    else { steps[0].setAttribute("aria-current", "true"); steps[1].removeAttribute("aria-current"); }
  }

  function render(t) {
    apply(t);
    if (t >= END) return;
    ctx.clearRect(0, 0, W, H);
    var bed = 1 - span(t, 8.5, 9.5);
    if (bed > 0) {
      ctx.globalAlpha = bed;
      drawBed(t);
      var p = ease(span(t, .8, 3.5));
      if (t < 7) {
        drawCut(t, p);
        drawMachine(t, p);
        if (t < 4.4) drawSparks(t);
        drawFacts(t, p);
        drawPart(t);
        drawCursor(t);
      }
      ctx.globalAlpha = 1;
    }
    drawData(t);
    root.dataset.t = t.toFixed(2);
  }

  var raf = 0, last = 0, now = 0, speed = 1;
  function tick(ts) {
    now += (ts - last) / 1000 * speed; last = ts;
    if (now >= END) { now = END; render(END); raf = 0; return; }
    render(now);
    raf = requestAnimationFrame(tick);
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  function play(from, sp) {
    stop(); now = from; speed = sp;
    if (calm) { now = from === 0 ? 6.8 : END; render(now); return; }
    last = performance.now(); raf = requestAnimationFrame(tick);
  }

  root.classList.add("hs--js");
  layout();
  var played = false;
  function startOne() { play(0, played ? 1.5 : 1); played = true; }
  // For checking any single frame by hand; playback does not use it.
  root.hsSeek = function (t) { stop(); now = t; render(t); };

  steps[0].addEventListener("click", startOne);
  steps[1].addEventListener("click", function () { stop(); now = END; render(END); });
  root.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") steps[1].click();
    if (e.key === "ArrowLeft") steps[0].click();
  });
  var startX = null;
  stage.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) steps[dx < 0 ? 1 : 0].click();
  }, { passive: true });
  var resizeTimer = 0;
  window.addEventListener("resize", function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(function () { layout(); if (!raf) render(now); }, 120); });
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { layout(); startOne(); });
})();
