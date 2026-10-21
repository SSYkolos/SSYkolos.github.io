/* Live demo: NACHA/ACH validator of the SEPA & NACHA Payment File API (registers with /assets/js/live-demo.js). */
(function () {
  "use strict";
  if (!window.KHDemo) return;

  KHDemo.register("ach", {
    working: "Checking every 94-character record, the routing check digits and the batch and file totals.",
    next: "The full API also generates NACHA files from JSON or CSV, lists the entries as JSON or CSV and explains return and change codes.",
    fileNote: "ACH files contain names, account numbers and amounts.",
    tooLarge: "Try a smaller file. The API itself accepts 10 MB.",

    precheck: function (file, head, u) {
      var e = u.ext(file.name);
      if (["csv", "json", "xlsx", "xls", "ods"].indexOf(e) >= 0) {
        return u.problem("This is a list of payments, not a NACHA file",
          "The demo checks finished NACHA (ACH) files. Turning a CSV or JSON list into a NACHA file is what the API's " +
          "generate endpoint does.");
      }
      if (u.startsWith(head, "%PDF")) {
        return u.problem("This is a PDF",
          "The demo reads NACHA files: the plain-text ACH file with 94-character lines that payroll or accounting " +
          "software exports for the bank.");
      }
      if (u.startsWith(head, "<?xml") || u.startsWith(head, "<Document")) {
        return u.problem("This looks like a SEPA XML file",
          "The demo on this page checks US NACHA files. SEPA pain.001 and pain.008 files are checked by the pain.001 validator.");
      }
      return null;
    },

    help: {
      UNSUPPORTED_FORMAT: ["This is not a NACHA file",
        "A NACHA file starts with the file header record: a line beginning with 101. The demo validates NACHA (ACH) files only."]
    },

    render: function (body, file, u) {
      var el = u.el, d = body.demo || {}, s = body.summary || {};
      var detail = ["NACHA", (s.sec_codes || []).join(", "),
        (s.entries || 0) + (s.entries === 1 ? " entry" : " entries"),
        u.plural(body.error_count, "error"), u.plural(body.warning_count, "warning"),
        d.processing_ms != null ? d.processing_ms + " ms" : null].filter(Boolean).join(" · ");
      var out = [u.summary(u.verdict(body.valid ? "VALID" : "INVALID"), detail, file)];

      out.push(el("p", { class: "demo__label", text: "File" }), el("dl", { class: "mini" }, [
        u.miniRow("Origin", [s.immediate_origin_name, s.immediate_origin].filter(Boolean).join(" · ") || "–"),
        u.miniRow("Destination", [s.immediate_destination_name, s.immediate_destination].filter(Boolean).join(" · ") || "–"),
        u.miniRow("Batches · entries", (s.batches != null ? s.batches : "–") + " · " + (s.entries != null ? s.entries : "–")),
        u.miniRow("Returns · changes", (s.returns || 0) + " · " + (s.notifications_of_change || 0)),
        u.miniRow("Total debit", s.total_debit != null ? s.total_debit + " USD" : "–"),
        u.miniRow("Total credit", s.total_credit != null ? s.total_credit + " USD" : "–")
      ]));

      var issues = body.issues || [];
      if (issues.length) {
        out.push(el("p", { class: "demo__label", text: "Problems found" }));
        out.push(el("div", { class: "demo__table" }, [el("table", null, [
          el("thead", null, [el("tr", null, [el("th", { text: "Severity" }), el("th", { text: "Rule" }),
            el("th", { text: "Where" }), el("th", { text: "Explanation" })])]),
          el("tbody", null, issues.map(function (i) {
            var where = i.line ? "line " + i.line + (i.column ? ", col " + i.column : "") : "–";
            return el("tr", null, [
              el("td", null, [u.verdict(String(i.severity).toUpperCase())]),
              el("td", { text: i.rule }),
              el("td", { text: where }),
              el("td", { text: i.message })
            ]);
          }))
        ])]));
        if (body.issues_truncated) out.push(el("p", { class: "live__fineprint", text: "Only the first 500 problems are listed." }));
      } else {
        out.push(el("p", { class: "live__fineprint", text: "No problems found." }));
      }
      out.push(u.jsonDetails(body, "POST /demo/ach/validate"));
      return out;
    }
  });
})();
