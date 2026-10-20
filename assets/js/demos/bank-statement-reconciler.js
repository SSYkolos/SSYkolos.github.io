/* Live demo: Bank Statement Reconciler (registers with /assets/js/live-demo.js). */
(function () {
  "use strict";
  if (!window.KHDemo) return;

  KHDemo.register("bank-statement-reconciler", {
    working: "Reading the statement and checking every balance.",
    next: "The full API also returns every transaction and exports CSV, hledger, Beancount and camt.053.",
    fileNote: "Bank statements contain names, IBANs and amounts.",
    tooLarge: "Try a single month's statement instead of a whole archive. The API itself accepts 10 MB.",
    manyFiles: "To check several statements at once, put them in a ZIP.",

    precheck: function (file, head, u) {
      var e = u.ext(file.name);
      if (u.startsWith(head, "%PDF")) {
        return u.problem("This is a PDF statement",
          "The tool reads the electronic statement files banks provide for accounting software, not PDFs. " +
          "In your online bank, look for an export or download option named MT940, STA, SWIFT or camt.053 (XML). " +
          "Business accounts almost always have it, sometimes under 'Accounting export' or 'Statement files'.");
      }
      if (["csv", "xlsx", "xls", "ods"].indexOf(e) >= 0) {
        return u.problem("This looks like a spreadsheet export",
          "Every bank lays out its CSV or Excel export differently, so the tool reads the standard bank formats instead: " +
          "MT940 / MT942 (often .sta or .txt) and camt.052 / 053 / 054 (XML). Look for those in your bank's export options.");
      }
      return null;
    },

    help: {
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
      NO_STATEMENTS: ["No statements found", "The file was read, but it contains no statements."]
    },

    render: function (body, file, u) {
      var el = u.el, d = body.demo || {};
      var out = [u.summary(u.verdict(body.overall_verdict),
        u.plural(body.statement_count, "statement") + " · " + u.plural(body.transaction_count, "transaction") +
        " · " + body.detected_format + (d.processing_ms != null ? " · " + d.processing_ms + " ms" : ""), file)];
      (body.warnings || []).forEach(function (w) {
        out.push(el("p", { class: "demo__warning" }, [el("b", { text: w.type }), w.message]));
      });
      var stmts = el("div", { class: "demo__stmts demo__stmts--grid" });
      (body.statements || []).forEach(function (s) {
        var dl = el("dl", { class: "mini" }, [
          el("div", { class: "mini__head" }, [el("dt", { text: s.statement_reference || s.account_id || "Statement" }),
            el("dd", null, [u.verdict(s.audit_verdict)])]),
          u.miniRow("Account", s.account_id || "–"),
          u.miniRow("Opening", s.opening_balance != null ? s.opening_balance : "–"),
          u.miniRow(u.opLabel("+", " Credits"), s.total_credits),
          u.miniRow(u.opLabel("−", " Debits"), s.total_debits),
          u.miniRow(u.opLabel("=", " Calculated"), s.calculated_closing_balance != null ? s.calculated_closing_balance : "–", "mini__sum"),
          u.miniRow("Bank's closing", (s.closing_balance != null ? s.closing_balance : "–") + " " + (s.currency || ""))
        ]);
        if (s.discrepancy_amount && Number(s.discrepancy_amount) !== 0) {
          dl.appendChild(u.miniRow("Difference", s.discrepancy_amount, "mini__bad"));
        }
        (s.audit_notes || []).forEach(function (n) { dl.appendChild(u.miniRow("Note", n, "mini__note")); });
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
          : u.plural(d.transactions_total || rows.length, "transaction") + ".";
        out.push(el("p", { class: "demo__label", text: "Transactions" }));
        out.push(el("div", { class: "demo__table" }, [el("table", null, [
          el("thead", null, [el("tr", null, [el("th", { text: "Date" }), el("th", { class: "num", text: "Amount" }),
            el("th", { text: "Counterparty" }), el("th", { text: "Reference" }), el("th", { text: "Purpose" })])]),
          el("tbody", null, rows)
        ])]));
        out.push(el("p", { class: "live__fineprint", text: shownNote + (d.redacted ? " Names, IBANs and emails are masked." : "") }));
      }
      out.push(u.jsonDetails(body, "POST /demo/reconcile"));
      return out;
    }
  });
})();
