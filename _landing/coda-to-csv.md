---
title: CODA to CSV converter
h1: Convert Belgian CODA statements to CSV
product: bank-statement-reconciler
order: 5
summary: Turn a Belgian CODA 2.6 file into clean columns for Excel, with balances and the trailer totals checked.
description: Convert CODA bank statements from Belgian banks to CSV for Excel. Counterparty, IBAN and structured communication in their own columns, balances checked to the cent. Try it free.
lede: Drop a CODA file below and see every movement in clean columns, with the old and new balance and the file's trailer totals checked to the cent. The API turns the same result into an Excel-ready CSV.
try_intro: "Your file is read in memory and discarded right after; names and IBANs are masked unless you switch that off. The fifth sample tab is a CODA file with two accounts, a direct debit and a globalised supplier batch."
steps:
  - "Download the statement from your bank's business portal as **CODA** (coded statement of account). The file usually ends in `.cod`."
  - "Drop it into the box above. The live demo shows the audit for every account and the first 25 movements."
  - "For the CSV itself, every transaction and whole archives, the API returns `output_format=csv`, or JSON, hledger, Beancount and camt.053."
body_title: How CODA files are read
faq:
  - q: What is a CODA file?
    a: "CODA is the Belgian standard for electronic bank statements, published by Febelfin and imported by Belgian accounting software. A file is a series of 128-character records: `0` header, `1` old balance, `2` movements, `3` information, `4` free messages, `8` new balance and `9` trailer. The converter reads version 2.6, with or without line breaks between the records."
  - q: Why not open the CODA file in Excel directly?
    a: "Every value sits at a fixed position inside the 128 characters, and one movement is spread over several records: the amount, transaction code and communication in the first, further references in the next, the counterparty's IBAN and name in a third. The converter puts them together into one row per movement."
  - q: What happens to structured communications?
    a: "Belgian structured communications are shown as `+++090/9337/55493+++`, and their mod-97 check digits are validated; a wrong one is reported as a warning. In the CSV such cells start with an apostrophe, because Excel would otherwise read the leading `+` as a formula."
  - q: How are globalised payments handled?
    a: "When the bank books several payments as one total, the total is the transaction on the statement, so it is counted once. The individual payments behind it, with their own names, IBANs and communications, are kept in `batch_details` in the JSON."
  - q: Does it check that nothing is missing?
    a: "Yes. Every account is checked with old balance + credits − debits = new balance, to the cent, and the record count and totals in the trailer record must match the file. Consecutive statements must also connect, so a missing one is reported."
  - q: Is my statement stored?
    a: "No. The demo service reads the file in memory, sends the result back to your browser and discards the file. Nothing is written to disk. In the demo, names, IBANs and e-mail addresses are masked by default."
---

The CSV has one row per movement, with the same 29 columns as for every other format. For CODA these are filled:

| Column | Example |
|---|---|
| `account_id`, `currency` | `BE68539007547034`, `EUR` |
| `booking_date`, `value_date` | `2026-10-20` |
| `signed_amount` | `1250.50` or `-45.67` |
| `counterparty_name`, `counterparty_iban`, `counterparty_bic` | `Café Liégeois SA`, `BE71096123456769`, `KREDBEBB` |
| `purpose` | the free communication, or the structured `+++…+++` one |
| `end_to_end_id`, `mandate_id`, `creditor_id`, `return_reason` | SEPA references and the return reason of a direct debit, when the bank sends them |
| `bank_transaction_code`, `booking_text` | `00501050`, `Direct debit` |
| `transaction_hash` | a stable ID, so importing the same file twice does not create duplicates |

Accented names are decoded from UTF-8 or Windows-1252 / Latin-1. The booking text names the transaction family
from the CODA code list, not every individual transaction code. Separate applications, which carry zeroed balances,
are marked `UNVERIFIABLE`; a file without movements is read as a day without movements.

The converter is independent and not affiliated with any bank or with Febelfin.
