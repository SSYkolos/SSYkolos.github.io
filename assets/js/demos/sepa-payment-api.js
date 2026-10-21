/* Live demo: SEPA Payment File API (registers with /assets/js/live-demo.js). */
(function () {
  "use strict";
  if (!window.KHDemo) return;

  var KIND = { credit_transfer: "credit transfer", direct_debit: "direct debit" };

  KHDemo.register("sepa-payment-api", {
    working: "Checking the file against the ISO 20022 schema and the SEPA rules.",
    next: "The full API also generates pain.001 / pain.008 from JSON or CSV, converts 2009 files to 2019 and reads pain.002 status reports.",
    fileNote: "Payment files contain names, IBANs and amounts.",
    tooLarge: "Try a smaller file. The API itself accepts 10 MB.",

    precheck: function (file, head, u) {
      var e = u.ext(file.name);
      if (["csv", "json", "xlsx", "xls", "ods"].indexOf(e) >= 0) {
        return u.problem("This is a list of payments, not a SEPA file",
          "The demo checks finished pain.001 and pain.008 XML files. Turning a CSV or JSON list into a pain.001 or pain.008 " +
          "file is what the API's generate endpoint does.");
      }
      if (u.startsWith(head, "%PDF")) {
        return u.problem("This is a PDF",
          "The demo reads SEPA payment files: the pain.001 (transfers) or pain.008 (direct debits) XML that accounting " +
          "or payroll software exports for the bank.");
      }
      return null;
    },

    help: {
      UNSUPPORTED_FORMAT: ["This is not a supported SEPA payment file",
        "The demo validates pain.001.001.03 / .09 (credit transfers) and pain.008.001.02 / .08 (direct debits)."],
      MALFORMED_XML: ["This XML file could not be read",
        "It is not well-formed XML. A file that a program produced should always be well-formed, so the export itself may be broken."],
      UNSAFE_XML: ["This XML file was rejected for safety",
        "It contains constructs (such as entity definitions) that are used in attacks against XML parsers, so it was not processed."]
    },

    render: function (body, file, u) {
      var el = u.el, d = body.demo || {}, s = body.summary || {};
      var detail = [body.message_type, KIND[body.kind] || body.kind,
        body.profile === "de" ? "EPC + German rules" : "EPC rules",
        u.plural(s.transactions || 0, "transaction"),
        s.total_amount != null ? s.total_amount + " " + (s.currency || "") : null,
        u.plural(body.error_count, "error"), u.plural(body.warning_count, "warning"),
        d.processing_ms != null ? d.processing_ms + " ms" : null].filter(Boolean).join(" · ");
      var out = [u.summary(u.verdict(body.valid ? "VALID" : "INVALID"), detail, file)];

      out.push(el("p", { class: "demo__label", text: "File" }), el("dl", { class: "mini" }, [
        u.miniRow("Message ID", s.message_id || "–"),
        u.miniRow("Payment blocks", s.payment_blocks != null ? String(s.payment_blocks) : "–"),
        u.miniRow("Transactions", s.transactions != null ? String(s.transactions) : "–"),
        u.miniRow("Total", s.total_amount != null ? s.total_amount + " " + (s.currency || "") : "–")
      ]));

      var issues = body.issues || [];
      if (issues.length) {
        out.push(el("p", { class: "demo__label", text: "Problems found" }));
        out.push(el("div", { class: "demo__table" }, [el("table", null, [
          el("thead", null, [el("tr", null, [el("th", { text: "Severity" }), el("th", { text: "Rule" }),
            el("th", { text: "Where" }), el("th", { text: "Explanation" })])]),
          el("tbody", null, issues.map(function (i) {
            return el("tr", null, [
              el("td", null, [u.verdict(String(i.severity).toUpperCase())]),
              el("td", { text: i.rule }),
              el("td", { text: (i.path || "–") + (i.line ? " (line " + i.line + ")" : "") }),
              el("td", { text: i.message })
            ]);
          }))
        ])]));
      } else {
        out.push(el("p", { class: "live__fineprint", text: "No problems found." }));
      }
      out.push(u.jsonDetails(body, "POST /demo/validate"));
      return out;
    }
  });
})();
