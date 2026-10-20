/*
  Live demo uploader for the product pages ("Your own file" tab).
  Sends the chosen file to the demo service and renders the answer. No cookies, no storage,
  no third parties. Server data is only ever inserted as text (never as HTML); the SVG preview
  is rebuilt from validated path data.
*/
(function () {
  "use strict";

  var panels = document.querySelectorAll(".live[data-endpoint]");
  if (!panels.length || !window.fetch || !window.FormData) return;

  var MB = 1024 * 1024;
  var SLOW_MS = 2500;
  var TIMEOUT_MS = 60000;

  // ---------------------------------------------------------------- tiny DOM helper
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

  // ---------------------------------------------------------------- checks before upload
  function readHead(file) {
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onload = function () { resolve(new Uint8Array(reader.result)); };
      reader.onerror = function () { resolve(new Uint8Array(0)); };
      reader.readAsArrayBuffer(file.slice(0, 64));
    });
  }
  function startsWith(bytes, text) {
    for (var i = 0; i < text.length; i++) if (bytes[i] !== text.charCodeAt(i)) return false;
    return bytes.length >= text.length;
  }
  function ext(name) { var m = /\.([a-z0-9]+)$/i.exec(name || ""); return m ? m[1].toLowerCase() : ""; }

  function precheck(kind, file, head, maxBytes) {
    var e = ext(file.name);
    if (file.size === 0) return problem("This file is empty", "Please choose the file again; it may not have finished downloading.");
    if (file.size > maxBytes) {
      return problem("This file is larger than the demo accepts",
        "The demo takes files up to " + fmtBytes(maxBytes) + "; this one is " + fmtBytes(file.size) + ". " +
        (kind === "reconciler" ? "Try a single month's statement instead of a whole archive. The API itself accepts 10 MB."
                               : "Try a single part instead of a full sheet. The API itself accepts 25 MB."));
    }
    if (startsWith(head, "%PDF")) {
      return kind === "reconciler"
        ? problem("This is a PDF statement",
            "The tool reads the electronic statement files banks provide for accounting software, not PDFs. " +
            "In your online bank, look for an export or download option named MT940, STA, SWIFT or camt.053 (XML). " +
            "Business accounts almost always have it, sometimes under 'Accounting export' or 'Statement files'.")
        : problem("This is a PDF", "The API reads DXF drawings. Most CAD programs can export a DXF via 'Save as' or 'Export'.");
    }
    // A DWG starts with its version tag ("AC1032" ...); an ASCII or binary DXF never does.
    if (kind === "dxf" && (e === "dwg" || startsWith(head, "AC10"))) {
      return problem("This is a DWG file",
        "DWG is AutoCAD's closed format, so the API reads DXF instead. Exporting is quick: " +
        "AutoCAD: Save As, then choose DXF. SolidWorks: File, Save As, .dxf. Fusion 360: right-click the sketch, Save as DXF. " +
        "Inkscape and LibreCAD can save DXF directly.");
    }
    if (kind === "dxf" && ["step", "stp", "stl", "iges", "igs", "svg", "png", "jpg", "jpeg"].indexOf(e) >= 0) {
      return problem("This is not a DXF drawing", "The API reads 2D DXF files. Export the flat pattern or sketch as DXF and try again.");
    }
    if (kind === "reconciler" && ["csv", "xlsx", "xls", "ods"].indexOf(e) >= 0) {
      return problem("This looks like a spreadsheet export",
        "Every bank lays out its CSV or Excel export differently, so the tool reads the standard bank formats instead: " +
        "MT940 / MT942 (often .sta or .txt) and camt.052 / 053 / 054 (XML). Look for those in your bank's export options.");
    }
    if (startsWith(head, "\x89PNG") || startsWith(head, "\xFF\xD8\xFF")) {
      return problem("This is an image", "Please choose the " + (kind === "reconciler" ? "statement file" : "DXF drawing") + " itself.");
    }
    return null;
  }
  function problem(title, text) { return { title: title, text: text }; }

  // ---------------------------------------------------------------- server errors in plain words
  var HELP = {
    reconciler: {
      UNSUPPORTED_FORMAT: ["This doesn't look like a bank statement file",
        "The tool reads MT940 and MT942 (often .sta, .mt940 or .txt) and ISO 20022 camt.052 / 053 / 054 (XML), or a ZIP of these. " +
        "BAI2, OFX, CODA and CSV exports are not supported yet."],
      MALFORMED_MT940: ["Part of this MT940 file could not be read",
        "The file is recognised as MT940, but one line does not follow the format. If your bank produced it unchanged, " +
        "I'd really like to see an anonymised copy: it is exactly how new bank dialects get supported."],
      MALFORMED_XML: ["This XML file could not be read",
        "It is not well-formed XML, or not a camt statement. If your bank produced it unchanged, an anonymised copy would help me support it."],
      UNSAFE_XML: ["This XML file was rejected for safety",
        "It contains constructs (such as entity definitions) that are used in attacks against XML parsers, so it was not processed."],
      NO_STATEMENTS: ["No statements found", "The file was read, but it contains no statements."],
      EMPTY_INPUT: ["This file is empty", "Please choose the file again."]
    },
    dxf: {
      UNSUPPORTED_FORMAT: ["This is not a DXF drawing",
        "The API reads DXF (ASCII or binary). DWG files need to be exported as DXF first: in most CAD programs that is 'Save As' or 'Export'."],
      MALFORMED_DXF: ["This drawing could not be read",
        "The file is damaged or not a complete DXF. If your CAD program produced it unchanged, I'd like to see it: " +
        "every file like this makes the parser better."],
      TOO_COMPLEX: ["This drawing is too complex for one request",
        "It has more geometry than the API processes in a single call. Try a single part or a smaller sheet."],
      EMPTY_INPUT: ["This file is empty", "Please choose the file again."]
    },
    common: {
      RATE_LIMITED: ["That's all the free runs for today", null],
      DEMO_BUSY: ["The demo is at its daily capacity", "So many people tried it today that the daily limit is reached. Please come back tomorrow."],
      PAYLOAD_TOO_LARGE: ["This file is larger than the demo accepts", null]
    }
  };

  // ---------------------------------------------------------------- SVG preview (rebuilt, never injected)
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

  // ---------------------------------------------------------------- result renderers
  function miniRow(label, value, cls) {
    return el("div", { class: cls }, [el("dt", null, label), el("dd", null, [value])]);
  }
  function opLabel(op, text) { return el("span", null, [el("span", { class: "op", text: op }), text]); }
  function verdict(v) { return el("span", { class: "verdict verdict--" + String(v).toLowerCase(), text: v }); }
  function jsonDetails(body, label) {
    return el("details", { class: "demo__more" }, [
      el("summary", null, ["JSON response ", el("span", { text: label })]),
      el("pre", null, [el("code", { text: JSON.stringify(body, null, 2) })])
    ]);
  }

  function renderReconciler(body, file) {
    var d = body.demo || {};
    var out = [];
    var head = el("div", { class: "live__summary" }, [
      el("p", { class: "demo__overall" }, [
        verdict(body.overall_verdict),
        el("span", { text: plural(body.statement_count, "statement") + " · " + plural(body.transaction_count, "transaction") +
          " · " + body.detected_format + " · " + (d.processing_ms != null ? d.processing_ms + " ms" : "") })
      ]),
      el("p", { class: "live__file", text: file.name + " · " + fmtBytes(file.size) })
    ]);
    out.push(head);
    (body.warnings || []).forEach(function (w) {
      out.push(el("p", { class: "demo__warning" }, [el("b", { text: w.type }), w.message]));
    });
    var stmts = el("div", { class: "demo__stmts demo__stmts--grid" });
    (body.statements || []).forEach(function (s) {
      var dl = el("dl", { class: "mini" }, [
        el("div", { class: "mini__head" }, [el("dt", { text: s.statement_reference || s.account_id || "Statement" }),
          el("dd", null, [verdict(s.audit_verdict)])]),
        miniRow("Account", s.account_id || "–"),
        miniRow("Opening", s.opening_balance != null ? s.opening_balance : "–"),
        miniRow(opLabel("+", " Credits"), s.total_credits),
        miniRow(opLabel("−", " Debits"), s.total_debits),
        miniRow(opLabel("=", " Calculated"), s.calculated_closing_balance != null ? s.calculated_closing_balance : "–", "mini__sum"),
        miniRow("Bank's closing", (s.closing_balance != null ? s.closing_balance : "–") + " " + (s.currency || ""))
      ]);
      if (s.discrepancy_amount && s.discrepancy_amount !== "0.00" && Number(s.discrepancy_amount) !== 0) {
        dl.appendChild(miniRow("Difference", s.discrepancy_amount, "mini__bad"));
      }
      (s.audit_notes || []).forEach(function (n) { dl.appendChild(miniRow("Note", n, "mini__note")); });
      stmts.appendChild(dl);
    });
    out.push(el("p", { class: "demo__label", text: "Audit per statement" }), stmts);

    var rows = [];
    (body.statements || []).forEach(function (s) {
      (s.transactions || []).forEach(function (t) {
        var amount = el("td", { class: "num" + (t.direction === "DEBIT" ? " neg" : "") }, [t.signed_amount + " " + t.currency]);
        if (t.is_reversal) amount.appendChild(el("span", { class: "tag", text: "reversal" }));
        if (t.status && t.status !== "BOOKED") amount.appendChild(el("span", { class: "tag", text: String(t.status).toLowerCase() }));
        rows.push(el("tr", null, [
          el("td", { text: t.booking_date || "–" }),
          amount,
          el("td", null, [t.counterparty_name || "–", t.counterparty_iban ? el("span", { class: "sub", text: t.counterparty_iban }) : null]),
          el("td", { text: t.end_to_end_id || "–" }),
          el("td", { text: t.purpose || "–" })
        ]));
      });
    });
    if (rows.length) {
      var shownNote = d.transactions_total > d.transactions_shown
        ? "First " + d.transactions_shown + " of " + d.transactions_total + " transactions. The API returns all of them."
        : plural(d.transactions_total || rows.length, "transaction") + ".";
      out.push(el("p", { class: "demo__label", text: "Transactions" }));
      out.push(el("div", { class: "demo__table" }, [el("table", null, [
        el("thead", null, [el("tr", null, [el("th", { text: "Date" }), el("th", { class: "num", text: "Amount" }),
          el("th", { text: "Counterparty" }), el("th", { text: "Reference" }), el("th", { text: "Purpose" })])]),
        el("tbody", null, rows)
      ])]));
      out.push(el("p", { class: "live__fineprint", text: shownNote + (d.redacted ? " Names, IBANs and emails are masked." : "") }));
    }
    out.push(jsonDetails(body, "POST /demo/reconcile"));
    return out;
  }

  function renderDxf(body, file) {
    var d = body.demo || {};
    var bb = body.bounding_box_mm || {};
    var out = [];
    out.push(el("div", { class: "live__summary" }, [
      el("p", { class: "demo__overall" }, [
        el("span", { class: "verdict", text: "ANALYSED" }),
        el("span", { text: (body.unit_name || "") + (d.processing_ms != null ? " · " + d.processing_ms + " ms" : "") })
      ]),
      el("p", { class: "live__file", text: file.name + " · " + fmtBytes(file.size) })
    ]));
    var preview = el("div", { class: "demo__svg", role: "img", "aria-label": "Preview of the cut geometry" });
    var svg = safeSvg(body.svg_preview);
    if (svg) preview.appendChild(svg); else preview.appendChild(el("p", { class: "live__fineprint", text: "No preview for this drawing." }));
    var dl = el("dl", { class: "mini mini--plain" }, [
      miniRow("Cut length", body.total_cut_length_mm + " mm", "mini__sum"),
      miniRow("Pierces", String(body.pierce_count)),
      miniRow("Parts / holes", body.part_count + " / " + body.hole_count),
      miniRow("Net area", (body.net_area_mm2 != null ? body.net_area_mm2 : "–") + " mm²"),
      miniRow("Bounding box", (bb.width != null ? bb.width + " × " + bb.height + " mm" : "–")),
      miniRow("Closed / open contours", body.closed_loop_count + " / " + body.open_contour_count)
    ]);
    if (body.duplicate_length_removed > 0) dl.appendChild(miniRow("Duplicate length removed", body.duplicate_length_removed + " (drawing units)"));
    var ign = body.ignored_entities || {};
    if (ign.filtered_by_layer_option) dl.appendChild(miniRow("Excluded by layer filter", String(ign.filtered_by_layer_option)));
    if (ign.on_disabled_layers) dl.appendChild(miniRow("On hidden or frozen layers", String(ign.on_disabled_layers)));
    Object.keys(ign.not_cut_geometry || {}).forEach(function (k) { dl.appendChild(miniRow("Ignored " + k, String(ign.not_cut_geometry[k]))); });
    var side = el("div", { class: "demo__col" }, [el("p", { class: "demo__label", text: "Result" }), dl]);
    (body.warnings || []).forEach(function (w) { side.appendChild(el("p", { class: "demo__warning", text: w })); });
    out.push(el("div", { class: "demo__split" }, [
      el("div", { class: "demo__col" }, [el("p", { class: "demo__label", text: "svg_preview" }), preview]), side
    ]));
    if ((body.bom_blocks || []).length) {
      out.push(el("p", { class: "demo__label", text: "bom_blocks" }));
      out.push(el("div", { class: "demo__table" }, [el("table", null, [
        el("thead", null, [el("tr", null, [el("th", { text: "Block" }), el("th", { class: "num", text: "Quantity" }),
          el("th", { text: "Layer" }), el("th", { text: "Attributes" })])]),
        el("tbody", null, body.bom_blocks.map(function (b) {
          var attrs = Object.keys(b.sample_attributes || {}).map(function (k) { return k + " = " + b.sample_attributes[k]; }).join(", ");
          return el("tr", null, [el("td", { text: b.block_name }), el("td", { class: "num", text: String(b.quantity) }),
            el("td", { text: b.layer || "–" }), el("td", { text: attrs || "–" })]);
        }))
      ])]));
    }
    var shown = JSON.parse(JSON.stringify(body));
    if (shown.svg_preview) shown.svg_preview = "<svg …> (shown above)";
    out.push(jsonDetails(shown, "POST /demo/analyze-dxf"));
    return out;
  }

  // ---------------------------------------------------------------- one panel
  function setup(panel) {
    var kind = panel.getAttribute("data-kind");
    var endpoint = panel.getAttribute("data-endpoint");
    var maxBytes = Number(panel.getAttribute("data-max-bytes")) || 2 * MB;
    var ui = panel.querySelector(".live__ui");
    var input = panel.querySelector(".drop__input");
    var drop = panel.querySelector(".drop");
    var status = panel.querySelector(".live__status");
    var result = panel.querySelector(".live__result");
    var quota = panel.querySelector(".live__quota");
    var redact = panel.querySelector(".live__redact");
    var layers = panel.querySelector(".live__layers");
    var busy = false;

    panel.querySelector(".live__nojs").hidden = true;
    ui.hidden = false;

    function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

    function setStatus(state, title, text) {
      clear(status);
      status.className = "live__status" + (state ? " live__status--" + state : "");
      if (!title) return;
      status.appendChild(el("p", { class: "live__status-title" }, [state === "working" ? el("span", { class: "spinner", "aria-hidden": "true" }) : null, title]));
      if (text) status.appendChild(el("p", { class: "live__status-text", text: text }));
    }

    function showProblem(title, text, extra) {
      clear(result);
      var card = el("div", { class: "live__problem" }, [
        el("p", { class: "live__problem-title", text: title }),
        text ? el("p", { text: text }) : null
      ].concat(extra || []));
      card.appendChild(el("p", { class: "live__fineprint", text: "Nothing was stored. You can try another file right away." }));
      card.appendChild(againButton());
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
        ? plural(left, "free run") + " left today. Files that cannot be read do not count."
        : "No free runs left today. They reset at 00:00 UTC" + (demo.resets_in_seconds ? ", in " + fmtHours(demo.resets_in_seconds) : "") + ".";
    }

    function run(file) {
      if (busy || !file) return;
      readHead(file).then(function (head) {
        var issue = precheck(kind, file, head, maxBytes);
        if (issue) { showProblem(issue.title, issue.text); return; }
        send(file);
      });
    }

    function send(file) {
      busy = true;
      panel.classList.add("is-busy");
      clear(result);
      setStatus("working", "Sending " + file.name + " (" + fmtBytes(file.size) + ")…",
        kind === "reconciler" ? "Reading the statement and checking every balance." : "Reading the drawing and measuring every contour.");
      var slow = setTimeout(function () {
        setStatus("working", "Still working…",
          "The demo server sleeps when nobody uses it, so the first run can take a few extra seconds while it wakes up. Thanks for waiting.");
      }, SLOW_MS);
      var controller = window.AbortController ? new AbortController() : null;
      var timeout = setTimeout(function () { if (controller) controller.abort(); }, TIMEOUT_MS);

      var form = new FormData();
      form.append("file", file, file.name);
      var url = endpoint;
      if (kind === "reconciler") url += "?redact_pii=" + (redact && !redact.checked ? "false" : "true");
      if (kind === "dxf" && layers && layers.value.trim()) url += "?exclude_layers=" + encodeURIComponent(layers.value.trim());

      fetch(url, { method: "POST", body: form, signal: controller ? controller.signal : undefined, credentials: "omit", cache: "no-store" })
        .then(function (resp) {
          return resp.json().catch(function () { return {}; }).then(function (body) { return { resp: resp, body: body }; });
        })
        .then(function (r) {
          updateQuota(r.body && r.body.demo);
          if (r.resp.ok) {
            clear(result);
            setStatus("done", "Done. Your file has already been discarded on the server.");
            var nodes = kind === "reconciler" ? renderReconciler(r.body, file) : renderDxf(r.body, file);
            nodes.forEach(function (n) { result.appendChild(n); });
            result.appendChild(el("div", { class: "live__next" }, [
              el("p", { text: kind === "reconciler"
                ? "The full API also returns every transaction and exports CSV, hledger, Beancount and camt.053."
                : "The full API accepts drawings up to 25 MB and can return every contour with its role, length and area." }),
              againButton()
            ]));
            result.focus({ preventScroll: true });
            return;
          }
          var err = (r.body && r.body.error) || {};
          var help = HELP[kind][err.code] || HELP.common[err.code];
          if (err.code === "RATE_LIMITED") {
            var reset = r.resp.headers.get("X-Demo-Reset");
            showProblem(help[0], "Thanks for trying it so thoroughly! The demo allows 15 runs per day to keep it free for everyone. " +
              "They reset at 00:00 UTC" + (reset ? ", in " + fmtHours(Number(reset)) : "") + ".");
          } else if (help) {
            showProblem(help[0], help[1] || err.message, help[1] && err.message ? [el("p", { class: "live__detail", text: "Details: " + err.message })] : null);
          } else if (r.resp.status >= 500) {
            showProblem("Something went wrong on the server", "That's on me, not on your file. Please try again in a minute.");
          } else {
            showProblem("The file could not be processed", err.message || ("The server answered with status " + r.resp.status + "."));
          }
        })
        .catch(function (e) {
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
        setStatus("", "Only the first file is used.", kind === "reconciler" ? "To check several statements at once, put them in a ZIP." : null);
      }
      run(f);
    });
  }

  // Dropping a file next to the drop zone should not navigate away from the page.
  window.addEventListener("dragover", function (e) { e.preventDefault(); });
  window.addEventListener("drop", function (e) { e.preventDefault(); });

  Array.prototype.forEach.call(panels, setup);

  // "Try it with your own file" buttons and #try-your-file links open the live tab.
  function openLive(scroll) {
    var radio = document.querySelector('.demo__radio[id$="-live"]');
    if (!radio) return;
    radio.checked = true;
    if (scroll) document.getElementById("try").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-open-live]"), function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); openLive(true); history.replaceState(null, "", "#try-your-file"); });
  });
  if (location.hash === "#try-your-file") openLive(true);
})();
