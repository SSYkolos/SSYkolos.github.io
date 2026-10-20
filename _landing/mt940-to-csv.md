---
title: MT940 to CSV converter
h1: Convert MT940 bank statements to CSV
product: bank-statement-reconciler
order: 1
summary: Turn an MT940 or MT942 file into clean columns for Excel, with every balance checked to the cent.
description: Convert MT940 / MT942 bank statement files to CSV for Excel. Counterparty, IBAN and reference in their own columns, every balance checked to the cent. Try it free with your own file.
lede: Drop an MT940 file below and see every transaction in clean columns, with each statement's balance checked to the cent. The API turns the same result into an Excel-ready CSV.
try_intro: "Your file is read in memory and discarded right after; names and IBANs are masked unless you switch that off. The sample tabs show the engine's complete output for example files, including the exact CSV."
steps:
  - "Export the statement from your online bank as **MT940**. Banks also call it STA, SWIFT or MT940 export; the file usually ends in `.sta`, `.mt940` or `.txt`."
  - "Drop it into the box above. The live demo shows the balance audit and the first 25 transactions."
  - "For the CSV itself, every transaction and whole archives, the API returns `output_format=csv`, or JSON, hledger, Beancount and camt.053."
body_title: What you get in the CSV
faq:
  - q: What is an MT940 file?
    a: "MT940 is the SWIFT format for end-of-day bank statements. Many European banks offer it for accounting software. It is a text file of tagged lines: `:20:` reference, `:25:` account, `:60F:` opening balance, `:61:` one transaction, `:86:` its details, `:62F:` closing balance."
  - q: Why not open the MT940 file in Excel directly?
    a: "Excel sees one long column of tags. The useful parts, such as the counterparty's name, IBAN or invoice reference, are packed into the `:86:` line in a different way by every bank (German `?20` subfields, Dutch `/EREF/` tags, Polish `~20` subfields). The converter separates them into their own columns."
  - q: Is my bank statement stored?
    a: "No. The demo service reads the file in memory, sends the result back to your browser and discards the file. Nothing is written to disk. In the demo, names, IBANs and e-mail addresses are masked by default."
  - q: Does it check that nothing is missing?
    a: "Yes. Every statement is checked with opening balance + credits − debits = closing balance, to the cent, and consecutive statements must connect: if one closes at a different balance than the next one opens, a missing statement is reported."
  - q: What about umlauts and Central European characters?
    a: "Files in UTF-8, Windows-1252 / Latin-1 and, for Hungarian, Polish, Czech and other Central European accounts, Windows-1250 / ISO-8859-2 / DOS 852 are decoded automatically. Very old DOS-encoded (cp850) German files may still show wrong umlauts."
  - q: Can I convert many files at once?
    a: "The API accepts a ZIP of statements and returns one CSV for all of them. The free demo takes one file up to 2 MB, shows the first 25 transactions and allows 15 runs a day."
---

The CSV has one row per transaction and 29 columns. The most useful ones:

| Column | Example |
|---|---|
| `booking_date`, `value_date` | `2026-01-05` |
| `signed_amount`, `currency` | `-189.95`, `EUR` |
| `counterparty_name`, `counterparty_iban`, `counterparty_bic` | `Acme Trading B.V.`, `NL44RABO…`, `RABONL2U` |
| `purpose` | `Invoice INV-2026-0012 January hosting` |
| `end_to_end_id`, `mandate_id`, `creditor_id` | SEPA references, when the bank provides them |
| `audit_verdict` | `VERIFIED`, `DISCREPANCY` or `UNVERIFIABLE` for the statement the row belongs to |
| `transaction_hash` | a stable ID, so importing the same statement twice does not create duplicates |

The file is UTF-8 with a byte-order mark, so Excel shows accents correctly. Amounts are plain decimals, never
rounded floats, and cells that could be read as spreadsheet formulas are neutralised.

The converter reads the formats used by banks such as ING, Rabobank, ABN AMRO and the German savings banks, SWIFT
envelopes and files with several statements. It is independent and not affiliated with any bank.
