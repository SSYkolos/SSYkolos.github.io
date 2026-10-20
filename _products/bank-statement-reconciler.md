---
title: Bank Statement Reconciler
order: 1
category: finance
tags: [mt940, mt942, camt.053, camt.054, iso 20022, sepa, reconciliation, csv, hledger, beancount]
featured: true
kind: REST API
status: Launching soon
tagline: Turn European bank statements into clean, verified data in one API call. Every balance checked to the cent, every counterparty extracted, no AI guesswork.
summary: Parses MT940 and ISO 20022 camt files, normalizes every transaction and proves each statement adds up to the cent.
description: Bank statement parser and reconciler API for MT940, MT942 and ISO 20022 camt.052/053/054. Verifies balances to the cent and exports JSON, CSV, hledger, Beancount and camt.053.
io:
  in: MT940 · MT942 · camt.052/053/054 · ZIP
  out: JSON · CSV · hledger · Beancount · camt.053
fact:
  value: "±0.00"
  label: every statement balance-checked to the cent
visual: audit
samples: reconciler
live_demo:
  api: reconciler
  path: /demo/reconcile
  accept: ".sta,.mt940,.mt942,.940,.942,.txt,.xml,.053,.052,.054,.zip"
  max_mb: 2
  noun: bank statement
  formats: "MT940 · MT942 · camt.052 / 053 / 054 · or a ZIP of them"
  options:
    - type: checkbox
      param: redact_pii
      checked: true
      label: "<b>Mask names, IBANs and emails</b> in the result. Recommended for real statements; switch it off to see every field the API extracts."
channels:
  - name: RapidAPI
    url: ""
  - name: Apify Store
    url: ""

features:
  - title: Balance audit on every statement
    text: "Opening + credits − debits = closing, to the cent (or the bank's own control totals for MT942 and camt.054). Each statement gets VERIFIED, DISCREPANCY with the exact difference, or UNVERIFIABLE."
  - title: Missing and duplicate statements
    text: Statements are put in date order per account, whatever order the files arrive in. A gap in the balance chain or a statement sent twice is flagged.
  - title: Real bank dialects
    text: German ?20 subfields, Dutch /EREF/ tags, Polish ~20 subfields, SEPA keywords, SWIFT envelopes, multi-statement files, camt batch bookings, reversals and pending entries.
  - title: Counterparty extraction
    text: Name, IBAN, BIC, end-to-end ID, mandate ID, creditor ID, purpose, return reason, booking text and GVC, as separate fields.
  - title: Whole archives in one call
    text: Send a ZIP of statements. A damaged or unrelated file inside it is reported as a warning; the rest is still processed.
  - title: Idempotent imports
    text: Every transaction carries a stable SHA-256 hash, so importing the same statement again never creates duplicates in an ERP or ledger.
  - title: MT940 to ISO 20022
    text: Export as camt.053.001.08 XML. The export is validated against the official ISO 20022 schema in the test suite, and balances are never invented.
  - title: Exact money, correct dates
    text: Amounts are decimal strings in the currency's minor units, never floats. Booking dates across year-end and late SEPA returns are resolved against the statement window.

specs:
  - label: Inputs
    value: SWIFT MT940 and MT942; ISO 20022 camt.052, camt.053, camt.054 (versions .02 – .08+); or a ZIP of any of these
  - label: Outputs
    value: JSON · CSV (Excel-ready) · hledger · Beancount · camt.053.001.08 XML
  - label: Verdicts
    value: "`VERIFIED` · `DISCREPANCY` (with the exact difference) · `UNVERIFIABLE`"
  - label: Encodings
    value: UTF-8, Windows-1252 / Latin-1; for Hungarian, Polish, Czech and other Central European accounts Windows-1250 / ISO-8859-2 / DOS 852, picked automatically
  - label: Endpoints
    value: "`POST /v1/reconcile` (file upload) · `POST /v1/reconcile/raw` (JSON body, text or base64)"
  - label: Limits
    value: 10 MB per request
  - label: Safety
    value: In-memory processing, protection against XXE, billion-laughs and ZIP-bomb inputs, optional PII redaction
  - label: Engine
    value: Deterministic, no AI or LLM. The same input always gives the same output.

details_title: A request and its answer
tested:
  - 128 automated tests, 10 realistic bank sample files and fuzz tests.
  - Run against about 65 public sample files from real European banks, including camt.052/053/054 versions 1 to 8. Every complete file is read.
  - Amounts match an independent open-source MT940 parser on 34 of 34 comparable files. The one difference is that library's sign error on reversals, confirmed by the bank's own balances.
  - Every camt.053 export is valid against the official ISO 20022 schema.
  - The container build runs the full test suite and fails if a single test fails.
limits:
  - "Not supported yet: BAI2 (US), OFX/QFX, CODA (Belgium) and pain.001 (a payment order, not a statement). These get a clear `UNSUPPORTED_FORMAT` message."
  - Very old DOS-encoded (cp850) German files may still show wrong umlauts.
  - 'Free text such as “AUFTRAGGEBER: name street zip city” keeps the name inside the purpose field, because name and address cannot be separated reliably.'
  - "A camt.053 export needs a balance, so MT942 and camt.054 files (which have none) cannot be converted to it."
privacy_summary: Statements are processed in memory and never written to disk. With redaction switched on, IBANs, counterparty names and emails are masked in the response.
---

One call with a statement file:

```bash
curl -X POST "https://<host>/v1/reconcile?output_format=json" -F "file=@statement.sta"
```

The response, shortened to one statement and one transaction:

```json
{
  "detected_format": "MT940",
  "statement_count": 2,
  "transaction_count": 3,
  "overall_verdict": "VERIFIED",
  "warnings": [],
  "statements": [{
    "account_id": "NL69INGB0123456789",
    "currency": "EUR",
    "opening_balance": "12500.00",
    "closing_balance": "14810.05",
    "total_credits": "2500.00",
    "total_debits": "189.95",
    "calculated_closing_balance": "14810.05",
    "discrepancy_amount": "0.00",
    "audit_verdict": "VERIFIED",
    "transactions": [{
      "transaction_hash": "…sha256…",
      "booking_date": "2026-01-05",
      "direction": "CREDIT",
      "amount": "2500.00",
      "currency": "EUR",
      "counterparty_name": "Acme Trading B.V.",
      "counterparty_iban": "NL44RABO0123456789",
      "end_to_end_id": "INV-2026-0012",
      "purpose": "Invoice INV-2026-0012 January hosting"
    }]
  }]
}
```

Non-JSON outputs (CSV, hledger, Beancount, camt.053) carry the audit result in the response headers
`X-Overall-Verdict`, `X-Statement-Count` and `X-Transaction-Count`.
