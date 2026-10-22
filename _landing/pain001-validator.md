---
title: pain.001 validator
h1: Validate a SEPA pain.001 or pain.008 file online
product: sepa-payment-api
order: 1
summary: Check a pain.001 or pain.008 file against the ISO 20022 schema and the EPC rules, with every problem explained.
description: Free online pain.001 and pain.008 validator. ISO 20022 XSD, EPC implementation guidelines 2025 and optional German bank rules, each problem with its location and a plain explanation.
lede: Drop a SEPA credit transfer (pain.001) or direct debit (pain.008) file below. You get the schema check, the SEPA rule check and a plain explanation of every problem, before the bank rejects the file.
try_intro: "The demo runs the same validation as the API. Your file is read in memory and discarded right after."
steps:
  - "Export the payment file from your accounting, payroll or banking software. It is an XML file, usually `.xml`."
  - "Drop it into the box above. Tick the German option if the file goes to a German bank."
  - "Read the report: each problem has its rule, its location in the file and an explanation. The API returns the same report as JSON."
body_title: What is checked
faq:
  - q: Which versions are supported?
    a: "`pain.001.001.03` and `pain.001.001.09` (credit transfers), `pain.008.001.02` and `pain.008.001.08` (direct debits)."
  - q: Which rules are checked?
    a: "The ISO 20022 schema (with line numbers) and the SEPA rules from the EPC customer-to-PSP implementation guidelines 2025. With the German option, also the German banks' rules from DFÜ-Abkommen Anlage 3 v3.7."
  - q: What is the difference between an error and a warning?
    a: "Errors break the schema or a SEPA rule. Warnings point to things that are allowed but worth a look: dates in the past, duplicate end-to-end IDs, possible duplicate payments. Unstructured addresses in 2019 files are reported as well."
  - q: Does a valid report mean my bank will accept the file?
    a: "It means the file passes the ISO schema and the EPC rules (and the German rules if ticked). Bank-specific profiles other than German are not included yet, and a bank's own duplicate detection may be stricter."
  - q: Is my file stored?
    a: "No. It is processed in memory and discarded right after the report is sent back. See the [privacy notice](/products/sepa-payment-api/privacy/#live-demo)."
---

| Area | Checks |
|---|---|
| File | XML safety (no DTDs or entities), ISO 20022 XSD with line numbers |
| Text | SEPA Latin character set (German profile: also ÄÖÜäöüß & \*); references must not start or end with `/` or contain `//`; no empty elements; names ≤ 70 |
| Totals | `NbOfTxs` and `CtrlSum` on the group and every payment block, recomputed exactly |
| Amounts | EUR only, 0.01–999,999,999.99, at most 2 decimals |
| Accounts | IBAN check digits; SEPA creditor identifier check digits |
| Remittance | one unstructured *or* one structured remittance (≤ 140 incl. tags), creditor reference type SCOR |
| Codes | service level SEPA, charge bearer SLEV, payment method TRF / DD |
| Direct debits | CORE or B2B (not mixed), sequence type, mandate signed not in the future |
| Addresses (2019) | town and country when a structured or hybrid address is used; town ≤ 35 characters; town or postal code not repeated in an address line; unstructured addresses are reported, with a pointer to the [address fix](/tools/structured-address-converter/) |
| Warnings | dates in the past, duplicate end-to-end IDs, possible duplicate payments |
| German profile | no byte order mark, UTF-8 only |
