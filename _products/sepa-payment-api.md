---
title: SEPA & NACHA Payment File API
order: 4
category: finance
tags: [sepa, pain.001, pain.008, pain.002, iso 20022, credit transfer, direct debit, xsd, epc, dfü, ebics, csv, validation, nacha, ach, ppd, ccd, return codes]
featured: false
kind: REST API
status: SEPA and ACH live on RapidAPI (free plan)
tagline: Generate, validate and convert SEPA payment files and US NACHA (ACH) files, and read the bank's answer. Every file is checked against the format's rules, with each problem explained in plain words.
summary: Builds pain.001, pain.008 and NACHA files from JSON or CSV, validates and converts SEPA files, checks NACHA files and reads pain.002 status reports and ACH returns.
description: SEPA and NACHA payment file API. Generate pain.001, pain.008 and NACHA ACH files from JSON or CSV, validate against ISO 20022, EPC and NACHA file rules, read pain.002 and ACH return codes.
io:
  in: JSON · CSV · pain.001 · pain.008 · pain.002 · NACHA
  out: pain.001.001.09 · pain.008.001.08 · NACHA · validation report
fact:
  value: "1.7 s"
  label: to validate a 6 MB file with 20,000 transfers
samples: sepa
live_demo:
  api: sepa
  path: /demo/validate
  accept: ".xml"
  max_mb: 0.5
  noun: pain.001 or pain.008 file
  formats: "pain.001.001.03 / .09 · pain.008.001.02 / .08"
  options:
    - type: checkbox
      param: profile
      value: de
      label: "<b>Also check the German banks' rules</b> (DFÜ-Abkommen Anlage 3): character set with umlauts, no byte order mark, UTF-8 only."
channels:
  - name: RapidAPI
    url: "https://rapidapi.com/SSYkolos/api/sepa-payment-file"
  - name: MCP server
    url: "https://github.com/SSYkolos/deterministic-finance-cad-mcp"

features:
  - title: Generate from JSON or CSV
    text: "Send the account holder and the payments as JSON, or as a CSV with a header row. You get `pain.001.001.09` (credit transfers) or `pain.008.001.08` (direct debits, CORE or B2B, grouped by sequence type). A file is returned only if it passes every check."
  - title: Validate with plain explanations
    text: "`pain.001.001.03` / `.09` and `pain.008.001.02` / `.08` are checked against the ISO 20022 XSD (with line numbers) and the EPC customer-to-PSP implementation guidelines 2025. Each problem comes with its rule, its location and a plain explanation."
  - title: German bank profile
    text: "With `profile=de`, the German banks' rules (DFÜ-Abkommen Anlage 3 v3.7) are checked too: the wider character set (ÄÖÜäöüß & *), no byte order mark, UTF-8 only."
  - title: Convert 2009 files to 2019
    text: "`pain.001.001.03` → `.09` and `pain.008.001.02` → `.08`. Nothing is guessed: the result must pass the 2019 schema and the SEPA rules."
  - title: Read the bank's answer
    text: "A `pain.002` status report (any version) becomes a list of accepted and rejected payments, with the reason codes in plain language."
  - title: Totals recomputed exactly
    text: "`NbOfTxs` and `CtrlSum` are recomputed on the group and on every payment block. Amounts are never rounded: an amount with more than 2 decimals is refused."
  - title: US NACHA (ACH) files
    text: "Generate PPD, CCD, WEB and TEL files from JSON or CSV, and validate any NACHA file: 94-character records, routing check digits, trace numbers, entry hash, batch and file totals, each problem with its line and column."
  - title: ACH returns explained
    text: "A return or notification-of-change file becomes a list: each R or C code in plain words, what to do next, and the corrected account data. Entries can also be listed as JSON or CSV."

specs:
  - label: Generate
    value: "JSON or CSV → `pain.001.001.09` · `pain.008.001.08` (CORE / B2B)"
  - label: Validate
    value: "`pain.001.001.03` / `.09` · `pain.008.001.02` / `.08`"
  - label: Convert
    value: "`pain.001.001.03` → `.09` · `pain.008.001.02` → `.08`"
  - label: Status reports
    value: "`pain.002` (any version)"
  - label: Rule sets
    value: "ISO 20022 XSD · EPC implementation guidelines 2025 · optional German profile (DFÜ-Abkommen Anlage 3 v3.7)"
  - label: Checks
    value: "SEPA character set · IBAN and creditor identifier check digits · `NbOfTxs` / `CtrlSum` · EUR only, 0.01–999,999,999.99, at most 2 decimals · names ≤ 70 · one unstructured or one structured remittance · service level, charge bearer, payment method · CORE or B2B, sequence type, mandate date · 2019 addresses · duplicate end-to-end IDs and possible duplicate payments (warnings)"
  - label: Endpoints
    value: "`POST /v1/generate` · `POST /v1/validate` · `POST /v1/convert` · `POST /v1/status` · `GET /v1/formats`"
  - label: ACH (NACHA)
    value: "PPD · CCD · WEB · TEL generated; any NACHA file validated (full rules for PPD, CCD, WEB, TEL, CTX, COR)"
  - label: ACH checks
    value: "94-character records, printable ASCII, record order, blocks of 10 · file header (routing check digit) · service class 200 / 220 / 225 · transaction codes, prenotes · routing check digit · addenda count and sequence · trace numbers unique and ascending · entry hash, debit and credit totals, block count · effective date (weekends, Federal Reserve holidays) · Same Day ACH limit · 2026 descriptions PAYROLL / PURCHASE · possible duplicates (warnings) · optional: balanced batches"
  - label: ACH endpoints
    value: "`POST /v1/ach/generate` · `POST /v1/ach/validate` · `POST /v1/ach/parse` (JSON or CSV) · `POST /v1/ach/returns` · `GET /v1/ach/codes`"
  - label: Input
    value: "Raw body (`application/xml`, ACH: `text/plain`), base64, or a multipart field `file`"
  - label: Limits
    value: 10 MB per request
  - label: Safety
    value: XML safety (no DTDs or entities); files are processed in memory and never stored
  - label: Engine
    value: Deterministic, no AI or LLM. The same input always gives the same output.

details_title: A request and its answer
tested:
  - Every rule has a test that breaks a valid file in exactly that way.
  - Files produced by the independent open-source `sepaxml` library (pain.001.001.03 / .09, pain.008.001.02 / .08) pass the validator with no errors, and both tools agree on the totals.
  - "Fuzzing: 36,000 mutated files, no crash."
  - "Speed: a 6 MB file with 20,000 transfers is validated in about 1.7 s."
  - "ACH: every rule has a test that breaks a valid file in exactly that way; 13 sample files from the independent Moov ACH project are valid for it too, and 5 broken ones are caught with the right rule; 30,000 mutated files, no crash; a 9.5 MB file (100,000 records) is validated in about 1 s."
  - The container build runs the full test suite and fails if a single test fails.
limits:
  - "No sending to banks (EBICS, bank APIs): out of scope."
  - "Bank-specific profiles other than German (Dutch, Austrian, Swiss SPS) are not included yet."
  - "The duplicate checks are warnings; a bank's own duplicate detection may be stricter."
  - "The live demo on this page validates only; generating, converting and reading pain.002 are API calls."
  - "ACH: no IAT generation or IAT-specific rules, no CTX generation, no live routing directory lookup (a routing number with a valid check digit may still not exist)."
  - "Not affiliated with Nacha. The ACH code explanations are our own summaries, not the text of the Nacha Operating Rules."
privacy_summary: Payment files are processed in memory and never stored. The response goes back to you and is not kept by the service.
---

Validate a file with the German profile:

```bash
curl -X POST "https://<host>/v1/validate?profile=de" -H "Content-Type: application/xml" --data-binary @payments.xml
```

The answer for an old pain.001.001.03 file whose control sum was changed by hand:

```json
{
  "message_type": "pain.001.001.03",
  "kind": "credit_transfer",
  "profile": "de",
  "valid": false,
  "error_count": 1,
  "warning_count": 1,
  "summary": {
    "message_id": "OLD-2026-10-20-1",
    "payment_blocks": 1,
    "transactions": 2,
    "total_amount": "1284.06",
    "currency": "EUR"
  },
  "issues": [
    {
      "severity": "error",
      "rule": "CONTROL_SUM",
      "path": "GrpHdr/CtrlSum",
      "message": "The message control sum is 91284.06; the amounts add up to 1284.06."
    },
    {
      "severity": "warning",
      "rule": "OLD_VERSION",
      "path": "",
      "message": "pain.001.001.03 is the 2009 version. Banks are moving to the 2019 versions (pain.001.001.09 / pain.008.001.08); German banks' specification limited the old version to November 2025. Use /v1/convert to migrate the file."
    }
  ]
}
```

Text outside the profile's character set is converted when a file is generated, as EPC and the German banks
recommend (ü → ue, ß → ss, & → +, other accents removed), and reported in a `CHARACTERS_CONVERTED` warning.

Errors have one shape, `{"error": {"code", "message", "issues"?}}`, for example `MALFORMED_XML`, `UNSAFE_XML`,
`UNSUPPORTED_FORMAT`, `INVALID_PAYMENT` (with the issues) and `CONVERSION_NOT_POSSIBLE`.

### ACH (NACHA)

The ACH endpoints are live [on RapidAPI](https://rapidapi.com/SSYkolos/api/sepa-payment-file), on the same plan as SEPA. Validate a NACHA file:

```bash
curl -X POST "https://<host>/v1/ach/validate" -H "Content-Type: text/plain" --data-binary @payroll.ach
```

One issue from the answer for a file with a mistyped routing number:

```json
{
  "severity": "error",
  "rule": "ROUTING_CHECK_DIGIT",
  "line": 3,
  "field": "check_digit",
  "column": "12",
  "found": "5",
  "expected": "4",
  "message": "231380105 is not a valid routing number: with these first 8 digits the check digit would be 4."
}
```

`POST /v1/ach/generate` builds one batch (PPD, CCD, WEB or TEL) from JSON or from `entries_csv`, and returns the file
only if it passes the validator. `POST /v1/ach/returns` explains every R and C code in a return or
notification-of-change file. See the free tools: [NACHA file validator](/tools/nacha-file-validator/),
[CSV to NACHA](/tools/csv-to-nacha/), [ACH return codes explained](/tools/ach-return-codes/).
Not affiliated with Nacha.
