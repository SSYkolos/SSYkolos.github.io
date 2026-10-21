/*
  Live demo, shared part ("Your own file" tab on product pages).

  Handles everything that is the same for every product: drop zone, checks before upload, options,
  daily quota, waking the server, plain-language errors and "send this to the developer".
  Each product adds one small file, /assets/js/demos/<product>.js, that registers what is specific
  to it (see KHDemo.register below and the existing files as examples):

    KHDemo.register("<product>", {
      working:   "Reading the drawing and measuring every contour.",   // shown while waiting
      next:      "The full API also ...",                               // shown under a result
      fileNote:  "Drawings can contain names ...",                      // shown next to "also send the file"
      tooLarge:  "Try a single part instead. The API itself accepts 25 MB.",
      precheck:  function (file, head, u) { return null or u.problem(title, text); },
      help:      { ERROR_CODE: [title, text], ... },
      render:    function (body, file, u) { return [nodes]; }
    });

  No cookies, no third parties. Server data is only ever inserted as text (never as HTML).
  The one thing kept: a ?ref=<channel> from a shared link, in sessionStorage for this tab only, sent as
  X-Client-Ref with demo runs so the demo service can count which community a run came from.
*/
(function () {
  "use strict";

  var MB = 1024 * 1024;
  var SLOW_MS = 2500;
  var TIMEOUT_MS = 60000;
  var plugins = {};
  var REF = (function () {
    try {
      var m = /[?&]ref=([a-z0-9_-]{1,40})(?:&|$)/i.exec(location.search);
      if (m) sessionStorage.setItem("kh_ref", m[1].toLowerCase());
      return sessionStorage.getItem("kh_ref");
    } catch (e) { return null; } // storage blocked: just no ref
  })();

  // ---------------------------------------------------------------- helpers shared with the product files
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (attrs[k] === null || attrs[k] === undefined || attrs[k] === false) return;
        if (k === "text") node.textContent = attrs[k];
        else if (k === "class") node.className = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }
  function fmtBytes(n) {
    if (n < 1024) return n + " bytes";
    if (n < MB) return (n / 1024).toFixed(n < 10240 ? 1 : 0) + " KB";
    return (n / MB).toFixed(1) + " MB";
  }
  function fmtHours(seconds) {
    var h = Math.floor(seconds / 3600), m = Math.round((seconds % 3600) / 60);
    return h > 0 ? h + " h " + m + " min" : m + " min";
  }
  function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }
  function startsWith(bytes, text) {
    for (var i = 0; i < text.length; i++) if (bytes[i] !== text.charCodeAt(i)) return false;
    return bytes.length >= text.length;
  }
  function ext(name) { var m = /\.([a-z0-9]+)$/i.exec(name || ""); return m ? m[1].toLowerCase() : ""; }
  function problem(title, text) { return { title: title, text: text }; }
  function miniRow(label, value, cls) {
    return el("div", { class: cls }, [el("dt", null, [label]), el("dd", null, [value && value.nodeType ? value : String(value)])]);
  }
  function opLabel(op, text) { return el("span", null, [el("span", { class: "op", text: op }), text]); }
  function verdict(v) { return el("span", { class: "verdict verdict--" + String(v).toLowerCase(), text: v }); }
  function jsonDetails(body, label) {
    return el("details", { class: "demo__more" }, [
      el("summary", null, ["JSON response ", el("span", { text: label })]),
      el("pre", null, [el("code", { text: JSON.stringify(body, null, 2) })])
    ]);
  }
  function summary(lead, detail, file) {
    return el("div", { class: "live__summary" }, [
      el("p", { class: "demo__overall" }, [lead, el("span", { text: detail })]),
      el("p", { class: "live__file", text: file.name + " · " + fmtBytes(file.size) })
    ]);
  }
  /* An SVG from the server is rebuilt from validated path data, never injected. */
  function safeSvg(markup) {
    if (!markup) return null;
    var doc = new DOMParser().parseFromString(markup, "image/svg+xml");
    var src = doc.documentElement;
    if (!src || src.nodeName !== "svg") return null;
    var vb = src.getAttribute("viewBox") || "";
    if (!/^[-0-9.eE ]+$/.test(vb)) return null;
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", vb);
    svg.setAttribute("aria-hidden", "true");
    var g = document.createElementNS(ns, "g");
    var srcG = src.querySelector("g");
    g.setAttribute("transform", "scale(1,-1)");
    g.setAttribute("fill", "none");
    var sw = srcG && srcG.getAttribute("stroke-width");
    if (sw && /^[0-9.eE-]+$/.test(sw)) g.setAttribute("stroke-width", sw);
    g.setAttribute("stroke-linejoin", "round");
    g.setAttribute("stroke-linecap", "round");
    Array.prototype.forEach.call(src.querySelectorAll("path"), function (p) {
      var d = p.getAttribute("d") || "";
      if (!/^[MLZ0-9 .eE-]+$/.test(d)) return;
      var path = document.createElementNS(ns, "path");
      path.setAttribute("d", d);
      g.appendChild(path);
    });
    svg.appendChild(g);
    return svg;
  }

  var u = {
    el: el, fmtBytes: fmtBytes, plural: plural, startsWith: startsWith, ext: ext, problem: problem,
    miniRow: miniRow, opLabel: opLabel, verdict: verdict, jsonDetails: jsonDetails, summary: summary, safeSvg: safeSvg
  };
  window.KHDemo = { register: function (id, plugin) { plugins[id] = plugin; }, u: u };

  // ---------------------------------------------------------------- the same for every product
  var COMMON_HELP = {
    RATE_LIMITED: ["That's all the free runs for today", null],
    DEMO_BUSY: ["The demo is at its daily capacity", "So many people tried it today that the daily limit is reached. Please come back tomorrow."],
    PAYLOAD_TOO_LARGE: ["This file is larger than the demo accepts", null],
    EMPTY_INPUT: ["This file is empty", "Please choose the file again."]
  };
  var USER_SIDE = ["PAYLOAD_TOO_LARGE", "EMPTY_INPUT"];

  function readHead(file) {
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onload = function () { resolve(new Uint8Array(reader.result)); };
      reader.onerror = function () { resolve(new Uint8Array(0)); };
      reader.readAsArrayBuffer(file.slice(0, 64));
    });
  }

  function precheck(plugin, file, head, maxBytes) {
    if (file.size === 0) return problem("This file is empty", "Please choose the file again; it may not have finished downloading.");
    if (file.size > maxBytes) {
      return problem("This file is larger than the demo accepts",
        "The demo takes files up to " + fmtBytes(maxBytes) + "; this one is " + fmtBytes(file.size) + ". " + (plugin.tooLarge || ""));
    }
    var own = plugin.precheck ? plugin.precheck(file, head, u) : null;
    if (own) return own;
    if (startsWith(head, "\x89PNG") || startsWith(head, "\xFF\xD8\xFF")) {
      return problem("This is an image", "Please choose the file itself, not a picture of it.");
    }
    return null;
  }

  // ---------------------------------------------------------------- one panel
  function setup(panel) {
    var product = panel.getAttribute("data-product");
    var plugin = plugins[product];
    var nojs = panel.querySelector(".live__nojs");
    if (!plugin) {
      nojs.textContent = "The live demo could not start. The sample tabs still show the engine's real output.";
      return;
    }
    var endpoint = panel.getAttribute("data-endpoint");
    var maxBytes = Number(panel.getAttribute("data-max-bytes")) || 2 * MB;
    var ui = panel.querySelector(".live__ui");
    var input = panel.querySelector(".drop__input");
    var drop = panel.querySelector(".drop");
    var status = panel.querySelector(".live__status");
    var result = panel.querySelector(".live__result");
    var quota = panel.querySelector(".live__quota");
    var options = panel.querySelectorAll("[data-param]");
    var feedbackEndpoint = panel.getAttribute("data-feedback");
    var help = {};
    Object.keys(COMMON_HELP).forEach(function (k) { help[k] = COMMON_HELP[k]; });
    Object.keys(plugin.help || {}).forEach(function (k) { help[k] = plugin.help[k]; });
    var busy = false;
    var woken = false;
    var last = null; // { file, context } of the most recent run, for reports

    nojs.hidden = true;
    ui.hidden = false;

    function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

    function setStatus(state, title, text) {
      clear(status);
      status.className = "live__status" + (state ? " live__status--" + state : "");
      if (!title) return;
      status.appendChild(el("p", { class: "live__status-title" }, [state === "working" ? el("span", { class: "spinner", "aria-hidden": "true" }) : null, title]));
      if (text) status.appendChild(el("p", { class: "live__status-text", text: text }));
    }

    function reportOffer(kind, buttonText) {
      if (!feedbackEndpoint || !last || !window.KHFeedback) return null;
      return window.KHFeedback.reportButton({
        endpoint: feedbackEndpoint, product: product, kind: kind, buttonText: buttonText,
        context: last.context, file: last.file, fileNote: plugin.fileNote || ""
      });
    }

    function showProblem(title, text, extra, final, reportable) {
      clear(result);
      var card = el("div", { class: "live__problem" }, [
        el("p", { class: "live__problem-title", text: title }),
        text ? el("p", { text: text }) : null
      ].concat(extra || []));
      if (!final) {
        card.appendChild(el("p", { class: "live__fineprint", text: "Nothing was stored. You can try another file right away." }));
        card.appendChild(againButton());
      }
      if (reportable) {
        var offer = reportOffer("bug", "Send this to the developer");
        if (offer) card.appendChild(offer);
      }
      result.appendChild(card);
      setStatus("", "");
      result.focus({ preventScroll: true });
    }

    function againButton() {
      var b = el("button", { type: "button", class: "btn", text: "Try another file" });
      b.addEventListener("click", function () { input.value = ""; input.click(); });
      return b;
    }

    function updateQuota(demo) {
      if (!demo || demo.remaining_today == null) return;
      var left = demo.remaining_today;
      quota.textContent = left > 0
        ? plural(left, "free run") + " left today" + (demo.daily_limit ? " (of " + demo.daily_limit + ")" : "") + ". Files that cannot be read do not count."
        : "No free runs left today. They reset at 00:00 UTC" + (demo.resets_in_seconds ? ", in " + fmtHours(demo.resets_in_seconds) : "") + ".";
    }

    function optionQuery() {
      var parts = [];
      Array.prototype.forEach.call(options, function (o) {
        var name = o.getAttribute("data-param");
        // A checkbox with a value sends name=value only when ticked; without one, name=true|false.
        if (o.type === "checkbox" && o.hasAttribute("value")) { if (o.checked) parts.push(encodeURIComponent(name) + "=" + encodeURIComponent(o.value)); }
        else if (o.type === "checkbox") parts.push(encodeURIComponent(name) + "=" + (o.checked ? "true" : "false"));
        else if (o.value.trim()) parts.push(encodeURIComponent(name) + "=" + encodeURIComponent(o.value.trim()));
      });
      return parts.join("&");
    }

    // The demo server sleeps when unused; wake it as soon as someone opens this tab.
    function wake() {
      if (woken) return;
      woken = true;
      var base = endpoint.replace(/\/demo\/.*$/, "");
      // The answer is not needed (no-cors: no CORS error in the console); the request alone wakes it.
      fetch(base + "/health", { mode: "no-cors", credentials: "omit", cache: "no-store" }).catch(function () {});
    }
    panel.addEventListener("pointerenter", wake);
    panel.addEventListener("focusin", wake);
    var radio = document.getElementById(panel.id.replace(/^live-/, "demo-") + "-live");
    if (radio) radio.addEventListener("change", wake);
    if (radio && radio.checked) wake();

    function run(file) {
      if (busy || !file) return;
      readHead(file).then(function (head) {
        var issue = precheck(plugin, file, head, maxBytes);
        if (issue) { showProblem(issue.title, issue.text); return; }
        send(file);
      });
    }

    function send(file) {
      busy = true;
      panel.classList.add("is-busy");
      clear(result);
      setStatus("working", "Sending " + file.name + " (" + fmtBytes(file.size) + ")…", plugin.working || "Processing the file.");
      var slow = setTimeout(function () {
        setStatus("working", "Still working…",
          "The demo server sleeps when nobody uses it, so the first run can take a few extra seconds while it wakes up. Thanks for waiting.");
      }, SLOW_MS);
      var controller = window.AbortController ? new AbortController() : null;
      var timeout = setTimeout(function () { if (controller) controller.abort(); }, TIMEOUT_MS);

      var form = new FormData();
      form.append("file", file, file.name);
      var query = optionQuery();
      last = { file: file, context: { source: "demo", page: location.pathname, file_name: file.name, file_size: file.size, options: query || null } };
      var url = endpoint + (query ? "?" + query : "");

      // Only send the header when there is a ref: it makes the browser send a CORS preflight first.
      fetch(url, { method: "POST", body: form, headers: REF ? { "X-Client-Ref": REF } : {}, signal: controller ? controller.signal : undefined, credentials: "omit", cache: "no-store" })
        .then(function (resp) {
          return resp.json().catch(function () { return {}; }).then(function (body) { return { resp: resp, body: body }; });
        })
        .then(function (r) {
          updateQuota(r.body && r.body.demo);
          var b = r.body || {};
          last.context.http_status = r.resp.status;
          last.context.api_version = b.api_version || null;
          last.context.detected_format = b.detected_format || null;
          last.context.overall_verdict = b.overall_verdict || null;
          last.context.processing_ms = b.demo && b.demo.processing_ms != null ? b.demo.processing_ms : null;
          if (b.error) { last.context.error_code = b.error.code; last.context.error_message = b.error.message; }
          if (r.resp.ok) {
            clear(result);
            var nodes;
            try {
              nodes = plugin.render(r.body, file, u);
            } catch (renderError) {
              if (window.console) console.error(renderError);
              last.context.error_code = "UI_RENDER_ERROR";
              last.context.error_message = String(renderError && renderError.message || renderError).slice(0, 300);
              showProblem("The result arrived, but this page could not display it",
                "That's a bug on my side, not a problem with your file. Please reload the page and try again.", null, false, true);
              return;
            }
            setStatus("done", "Done. Your file has already been discarded on the server.");
            nodes.forEach(function (n) { result.appendChild(n); });
            result.appendChild(el("div", { class: "live__next" }, [el("p", { text: plugin.next || "" }), againButton()]));
            var wrong = reportOffer("wrong_result", "Result doesn't look right? Tell me");
            if (wrong) result.appendChild(wrong);
            result.focus({ preventScroll: true });
            return;
          }
          var err = b.error || {};
          var h = help[err.code];
          if (err.code === "RATE_LIMITED") {
            var q = b.demo || {};
            showProblem(h[0], "Thanks for trying it so thoroughly! The demo allows " + (q.daily_limit || "a few") +
              " runs per day to keep it free for everyone. They reset at 00:00 UTC" +
              (q.resets_in_seconds ? ", in " + fmtHours(q.resets_in_seconds) : "") + ".",
              [el("p", { text: "Meanwhile, the sample tabs above show the full output, and you can download those files." })], true);
          } else if (err.code === "DEMO_BUSY") {
            showProblem(h[0], h[1], null, true);
          } else if (h) {
            showProblem(h[0], h[1] || err.message, h[1] && err.message ? [el("p", { class: "live__detail", text: "Details: " + err.message })] : null,
              false, USER_SIDE.indexOf(err.code) < 0);
          } else if (r.resp.status >= 500) {
            showProblem("Something went wrong on the server", "That's on me, not on your file. Please try again in a minute.", null, false, true);
          } else {
            showProblem("The file could not be processed", err.message || ("The server answered with status " + r.resp.status + "."), null, false, true);
          }
        })
        .catch(function (e) {
          if (window.console) console.error(e);
          if (e && e.name === "AbortError") {
            showProblem("This is taking too long", "The server did not answer within a minute. Please try again; very large files may need the full API.");
          } else {
            showProblem("Could not reach the demo server", "Please check your internet connection and try again. If it keeps happening, the demo may be down for a moment.");
          }
        })
        .then(function () {
          clearTimeout(slow);
          clearTimeout(timeout);
          busy = false;
          panel.classList.remove("is-busy");
        });
    }

    input.addEventListener("change", function () { run(input.files && input.files[0]); });
    ["dragenter", "dragover"].forEach(function (t) {
      drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add("is-over"); });
    });
    ["dragleave", "dragend", "drop"].forEach(function (t) {
      drop.addEventListener(t, function () { drop.classList.remove("is-over"); });
    });
    drop.addEventListener("drop", function (e) {
      e.preventDefault();
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 1) {
        setStatus("", "Only the first file is used.", plugin.manyFiles || null);
      }
      run(f);
    });
  }

  function start() {
    var panels = document.querySelectorAll(".live[data-endpoint]");
    if (!panels.length || !window.fetch || !window.FormData) return;
    Array.prototype.forEach.call(panels, setup);

    // Dropping a file next to the drop zone should not navigate away from the page.
    window.addEventListener("dragover", function (e) { e.preventDefault(); });
    window.addEventListener("drop", function (e) { e.preventDefault(); });

    // "Try it with your own file" links and #try-your-file open the live tab.
    function openLive(scroll) {
      var radio = document.querySelector('.demo__radio[id$="-live"]');
      if (!radio) return;
      radio.checked = true;
      radio.dispatchEvent(new Event("change"));
      if (scroll) document.getElementById("try").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    Array.prototype.forEach.call(document.querySelectorAll("[data-open-live]"), function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); openLive(true); history.replaceState(null, "", "#try-your-file"); });
    });
    if (location.hash === "#try-your-file") openLive(true);
  }

  // Product files are loaded after this one (also deferred) and register before DOMContentLoaded.
  // Deferred scripts run while readyState is already "interactive", so always wait for the event.
  var started = false;
  function startOnce() { if (!started) { started = true; start(); } }
  if (document.readyState === "complete") setTimeout(startOnce, 0);
  else {
    document.addEventListener("DOMContentLoaded", startOnce);
    window.addEventListener("load", startOnce);
  }
})();
