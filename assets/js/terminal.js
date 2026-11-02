/*
  Hidden terminal: press ` or ~ anywhere (outside a text field) to open, Esc to close.
  Pure navigation toy. Nothing is sent anywhere, nothing is stored. Output is inserted as text, never as HTML.
*/
(function () {
  "use strict";

  var data = JSON.parse(document.getElementById("term-data").textContent);
  var box, out, input, history = [], hpos = 0;

  function line(text, cls) {
    var p = document.createElement("div");
    p.className = "term__line" + (cls ? " term__line--" + cls : "");
    p.textContent = text;
    out.appendChild(p);
    out.scrollTop = out.scrollHeight;
  }

  function find(name) {
    var all = data.products.concat(data.tools);
    var exact = all.filter(function (x) { return x.name === name; })[0];
    return exact || all.filter(function (x) { return x.name.indexOf(name) === 0; })[0];
  }

  var commands = {
    help: function () {
      ["ls [products|tools]   list what we build",
       "open <name>           go to a product or tool (tab completes)",
       "pricing | about | contact | home",
       "whoami | date | echo | clear | exit"].forEach(function (t) { line(t); });
    },
    ls: function (args) {
      var what = args[0] || "";
      if (what !== "tools") data.products.forEach(function (p) { line("products/" + p.name + "   " + p.title); });
      if (what !== "products") data.tools.forEach(function (t) { line("tools/" + t.name + "   " + t.title); });
    },
    open: function (args) {
      var name = (args[0] || "").replace(/^(products|tools)\//, "");
      var hit = name && find(name);
      if (!hit) return line("open: no such product or tool: " + (args[0] || "(empty)") + ". Try ls.", "err");
      line("opening " + hit.title + "...");
      location.href = hit.url;
    },
    cd: function (args) { commands.open(args); },
    whoami: function () { line("guest. We're SSY Dynamics: deterministic software for finance and manufacturing data."); },
    date: function () { line(new Date().toString()); },
    echo: function (args) { line(args.join(" ")); },
    clear: function () { out.textContent = ""; },
    exit: function () { toggle(false); },
    sudo: function () { line("Nice try. This incident will be reported to nobody.", "err"); },
    rm: function () { line("rm: our files are deterministic and so is our refusal.", "err"); },
    contact: function () { line("mail: " + data.email); location.href = data.pages.contact; }
  };
  ["pricing", "about", "home"].forEach(function (k) {
    commands[k] = function () { line("opening /" + k + "..."); location.href = data.pages[k]; };
  });

  function run(raw) {
    var parts = raw.trim().split(/\s+/);
    var cmd = parts.shift();
    line("$ " + raw, "cmd");
    if (!cmd) return;
    history.push(raw);
    hpos = history.length;
    if (commands.hasOwnProperty(cmd)) commands[cmd](parts);
    else line(cmd + ": command not found. Type help.", "err");
  }

  function complete() {
    var m = input.value.match(/^(open|cd)\s+(\S*)$/);
    if (!m) return;
    var hit = find(m[2].replace(/^(products|tools)\//, ""));
    if (hit) input.value = m[1] + " " + hit.name;
  }

  function build() {
    box = document.createElement("div");
    box.className = "term";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Terminal");
    out = document.createElement("div");
    out.className = "term__out";
    out.setAttribute("aria-live", "polite");
    var row = document.createElement("label");
    row.className = "term__row";
    row.textContent = "$ ";
    input = document.createElement("input");
    input.className = "term__in";
    input.setAttribute("autocomplete", "off");
    input.setAttribute("spellcheck", "false");
    input.setAttribute("aria-label", "Command");
    row.appendChild(input);
    box.appendChild(out);
    box.appendChild(row);
    document.body.appendChild(box);
    line("ssy-dynamics shell. Type help. Esc closes.", "dim");

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { run(input.value); input.value = ""; }
      else if (e.key === "Tab") { e.preventDefault(); complete(); }
      else if (e.key === "ArrowUp" && hpos > 0) { input.value = history[--hpos]; e.preventDefault(); }
      else if (e.key === "ArrowDown") { hpos = Math.min(hpos + 1, history.length); input.value = history[hpos] || ""; }
      else if (e.key === "Escape") toggle(false);
    });
  }

  function toggle(show) {
    if (!box) build();
    box.classList.toggle("is-open", show);
    if (show) input.focus();
  }

  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    // On many layouts (Hungarian, German) ` and ~ are dead keys and never arrive as "`", so typing "ssy" works too.
    typed = (typed + (e.key.length === 1 ? e.key.toLowerCase() : "")).slice(-3);
    var deadTilde = e.key === "Dead" && (e.code === "Digit1" || e.code === "Digit7" || e.code === "Backquote");
    if (e.key === "`" || e.key === "~" || deadTilde || typed === "ssy") {
      e.preventDefault();
      typed = "";
      toggle(!(box && box.classList.contains("is-open")));
    }
  });
  var typed = "";

  try { console.log("%c psst. type ssy on the page.", "font-family:monospace"); } catch (e) {}
})();
