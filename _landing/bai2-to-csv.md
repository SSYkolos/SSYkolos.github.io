---
title: BAI2 to CSV converter
h1: Convert BAI2 bank files to CSV
product: bank-statement-reconciler
order: 4
summary: Turn a US BAI2 balance report into clean columns for Excel, with every account's balances and control totals checked.
description: Convert BAI2 bank files from US banks to CSV for Excel. Type codes named, continuation lines joined, balances and control totals checked to the cent. Try it free with your own file.
lede: Drop a BAI2 file below and see every account and transaction in clean columns, with balances and the file's control totals checked to the cent. The API turns the same result into an Excel-ready CSV.
try_intro: "Your file is read in memory and discarded right after; account numbers are masked unless you switch that off. The fourth sample tab is a BAI2 file with two groups and three accounts, including one where the bank sent detail for only some items."
steps:
  - "Download the report from your bank's cash management or treasury portal as **BAI2** (also called BAI, BAI 2 or Cash Management Balance Reporting). The file usually ends in `.bai`, `.bai2` or `.txt`."
  - "Drop it into the box above. The live demo shows the audit for every account and the first 25 transactions."
  - "For the CSV itself, every transaction and whole archives, the API returns `output_format=csv`, or JSON, hledger, Beancount and camt.053."
body_title: How BAI2 files are read
faq:
  - q: What is a BAI2 file?
    a: "BAI2 (Cash Management Balance Reporting, Version 2) is the format US banks use for previous-day and same-day account reports. It is a text file of comma-separated records: `01` file header, `02` group, `03` account with its balances and totals, `16` one transaction, `88` a continuation line, and `49`, `98`, `99` trailers with control totals."
  - q: Why not open the BAI2 file in Excel directly?
    a: "Excel splits the records at the commas, but every record type has different columns, amounts have no decimal point, transactions are identified by a three-digit type code, and long texts continue on `88` lines. The converter joins those lines, places the decimal point by currency (none for JPY) and names each type code, such as `195` Incoming Money Transfer."
  - q: What does the balance check do with BAI2?
    a: "For each account, opening balance + credits − debits must equal the closing balance, to the cent. The `49`, `98` and `99` trailers are checked as well: if their control totals or record counts do not match the file, the statement is marked `DISCREPANCY`."
  - q: My bank lists only some transactions. Is that a discrepancy?
    a: "Not by itself. BAI2 lets a bank send detail for only some items. When the account record carries the bank's total credits and debits (type codes `100` and `400`), the balances are checked against those totals and the missing detail is reported as a `DETAIL_INCOMPLETE` warning."
  - q: Is my bank file stored?
    a: "No. The demo service reads the file in memory, sends the result back to your browser and discards the file. Nothing is written to disk. In the demo, account numbers are masked by default. BAI2 has no separate name field, so names inside the bank's transaction text are shown as sent."
  - q: Can I convert many files at once?
    a: "The API accepts a ZIP of files and returns one CSV for all of them. The free demo takes one file up to 2 MB, shows the first 25 transactions and allows 5 runs a day."
---

The CSV has one row per transaction, with the same 29 columns as for every other format. For BAI2 these are filled:

| Column | Example |
|---|---|
| `account_id`, `currency` | `123456789`, `USD` |
| `booking_date`, `value_date` | `2026-10-18`; the value date follows the funds type, for example a value-dated item |
| `signed_amount` | `250000.00` or `-1234.56`, decimals placed by currency |
| `bank_transaction_code`, `booking_text` | `195`, `Incoming Money Transfer` (the name from the BAI2 type code table) |
| `bank_reference`, `customer_reference` | the bank's and your own reference from the `16` record |
| `purpose` | the transaction text, with its `88` continuation lines joined |
| `audit_verdict` | `VERIFIED`, `DISCREPANCY` or `UNVERIFIABLE` for the account the row belongs to |
| `transaction_hash` | a stable ID, so importing the same file twice does not create duplicates |

BAI2 has no separate fields for the counterparty's name or account, so the bank's text stays in `purpose`.
Type codes without a defined direction (unassigned codes, for example) are listed with status `INFO`, left out of
the balance check and reported as a warning. Same-day reports are not chained with the previous day's report.

The parser follows the BAI2 specification and reproduces every control total of its Appendix D sample. It is
independent and not affiliated with any bank or with the publisher of the standard.
