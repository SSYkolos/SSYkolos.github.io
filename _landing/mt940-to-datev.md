---
title: MT940 to DATEV converter
h1: Import MT940 and camt bank statements into DATEV
product: bank-statement-reconciler
order: 6
summary: Turn MT940 or camt bank statements into a DATEV EXTF Buchungsstapel, with every balance checked to the cent.
description: Convert MT940, camt.053 and other bank statement files into a DATEV EXTF Buchungsstapel for import. Every balance checked to the cent, non-EUR and mixed uploads refused instead of guessed.
lede: The API turns MT940 and camt bank statements into a DATEV EXTF Buchungsstapel that the accountant can import. Drop a statement below to see the balance audit and the transactions the batch is built from.
try_intro: "The demo shows the parsed statement and its balance audit, not the DATEV file itself; the DATEV export is an API option. Your file is read in memory and discarded right after; names and IBANs are masked unless you switch that off."
steps:
  - "Export the statement from your online bank as **MT940** (often `.sta`) or **camt.053** XML. camt.052/054, BAI2, CODA or a ZIP of several files work too."
  - "Drop it into the box above to check that every statement adds up and nothing is missing."
  - "Call the API with `output_format=datev`, your DATEV consultant number (`datev_consultant`) and client number (`datev_client`). The response is the Buchungsstapel to import into DATEV."
body_title: What goes into the Buchungsstapel
faq:
  - q: What does DATEV get?
    a: "A DATEV EXTF Buchungsstapel (format category 21, version 13): a Windows-1252, semicolon-separated text file with a header line, a column-name line and one line per booking."
  - q: Why are the consultant and client numbers required?
    a: "DATEV refuses a batch meant for another client, so the header must carry the right Berater- and Mandantennummer. They are passed as `datev_consultant` and `datev_client`."
  - q: I use SKR04, not SKR03. Does it work?
    a: "Yes. The defaults are the SKR03 accounts `1200` (bank) and `1360` (clearing). With SKR04, pass `datev_bank_account=1800` and `datev_contra_account=1460`, or any other accounts of the client's chart."
  - q: Our fiscal year does not start in January.
    a: "Pass the start as MMDD in `datev_fiscal_year_start`, for example `0701`. The default is `0101`."
  - q: Which uploads are refused?
    a: "Statements in a currency other than EUR (DATEV would need an exchange rate per booking), more than one bank account in one upload, and bookings from more than one fiscal year, because one Buchungsstapel covers one fiscal year. These get an `EXPORT_NOT_POSSIBLE` error instead of a guess. A statement sent twice inside a ZIP is exported once."
  - q: Are counterparty accounts and tax keys assigned?
    a: "No. Every booking goes against the clearing account, and the accountant reassigns it in DATEV. Per-counterparty contra-account rules and tax keys (BU-Schlüssel) are not included."
---

One booking per booked transaction; pending and informational entries are left out.

| DATEV field | Filled with |
|---|---|
| `Umsatz` | the amount, always positive, with a decimal comma |
| `Soll/Haben` | `S` for money in, `H` for money out, on the bank account |
| `Konto` | the bank account in the client's chart, `1200` by default |
| `Gegenkonto` | a clearing account, `1360` by default, for the accountant to reassign |
| `Belegdatum` | the booking date |
| `Belegfeld 1` | the end-to-end ID, reduced to the characters DATEV allows (max 36) |
| `Buchungstext` | counterparty name and purpose (max 60) |

The batch is not locked (`Festschreibung` 0), so the accountant can still edit the bookings in DATEV. The balance
audit comes with the file, in the response headers `X-Overall-Verdict`, `X-Statement-Count` and `X-Transaction-Count`.

The converter is independent and not affiliated with DATEV eG or any bank.
