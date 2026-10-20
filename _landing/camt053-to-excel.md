---
title: camt.053 to Excel converter
h1: Convert camt.053 bank statements to Excel
product: bank-statement-reconciler
order: 2
summary: Read ISO 20022 camt.053 (and camt.052 / 054) XML statements as clean rows, balances checked.
description: Convert ISO 20022 camt.053 XML bank statements to Excel-ready CSV. camt.052 and camt.054 too, versions .02 to .08. Balances checked to the cent. Try it free with your own file.
lede: Drop a camt.053 XML statement below and see it as clean rows, with the bank's own balances checked against the transactions. The API exports the same result as an Excel-ready CSV.
try_intro: "Your file is read in memory and discarded right after; names and IBANs are masked unless you switch that off. The third sample tab is a camt.053 file with a batch booking, a returned payment and a pending entry."
steps:
  - "Download the statement from your online bank as **camt.053** (ISO 20022, XML). Intraday reports are camt.052, debit and credit notifications camt.054: both work too."
  - "Drop the `.xml` file (or a ZIP of several) into the box above."
  - "Check the audit and the transactions. The API returns them as CSV for Excel, or as JSON, hledger or Beancount."
body_title: How camt files are read
faq:
  - q: What is camt.053?
    a: "camt.053 is the ISO 20022 XML format for end-of-day bank statements, the successor of MT940 in Europe. camt.052 carries intraday account reports and camt.054 debit and credit notifications."
  - q: Why can't Excel open camt.053 properly?
    a: "camt.053 is nested XML: a statement holds entries, an entry can hold a whole batch of payments, and names, IBANs and references sit several levels deep. Excel's XML import flattens this into confusing columns. The converter produces one row per transaction with the counterparty, IBAN and references in their own columns."
  - q: Which versions are supported?
    a: "camt.052, camt.053 and camt.054 in versions .02 to .08 and later, single files or a ZIP of them."
  - q: How are pending entries and returned payments handled?
    a: "Pending entries are listed but left out of the balance check. A returned or reversed payment is shown with the direction it actually has on the balance and marked as a reversal."
  - q: Is my file stored?
    a: "No. The demo service reads it in memory and discards it after sending the result back. XML files are also checked for constructs used in attacks on XML parsers (entity expansion, external entities) and refused if they contain them."
---

Every statement is audited: opening balance + credits − debits must equal the closing balance the bank reports,
to the cent. For files without balances (camt.054) the bank's control totals are used, or the statement is marked
`UNVERIFIABLE`.

A batch booking (one line on the statement, many payments behind it) keeps its individual payments in
`batch_details`. Amounts keep the currency's decimals exactly (0 for JPY, 2 for EUR, 3 for KWD).

In the API, the same result is also available as camt.053.001.08 XML. That export is validated against the official
ISO 20022 schema in the test suite.
