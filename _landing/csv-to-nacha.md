---
title: CSV to NACHA
h1: Convert a CSV of payments to a NACHA (ACH) file
product: sepa-payment-api
order: 4
summary: Turn a payroll or vendor CSV into a NACHA file that passes every check before it goes to the bank.
description: Convert CSV to a NACHA ACH file (PPD, CCD, WEB, TEL). Routing check digits, trace numbers, entry hash and totals computed for you; the file is returned only if it is valid.
lede: Turn a list of payments into a NACHA file with nothing left to chance. The first tab shows a file the API made from a three-line CSV; drop a NACHA file below to check one you already have. The conversion itself is an API call.
try_intro: "The demo validates NACHA files; turning a CSV into one is an API call. The first sample was generated from the CSV shown below. Please do not upload a real file with real account numbers."
samples: ach
live_demo:
  api: sepa
  plugin: ach
  path: /demo/ach/validate
  accept: ".ach,.txt,.dat,.nacha"
  max_mb: 0.5
  noun: NACHA (ACH) file
  formats: "NACHA · PPD, CCD, WEB, TEL, CTX, COR and more"
steps:
  - "Make a CSV with a header row: `name`, `routing`, `account`, `amount`, and optionally `type` (credit or debit), `account_type`, `identification_number`, `addenda`, `prenote`."
  - "Send it as `entries_csv` to the API's `POST /v1/ach/generate`, with your company details, the SEC code and the effective date."
  - "You get the NACHA file, or with `return_report=true` JSON with the file and its validation report. If anything is wrong, you get the problems instead of a file."
body_title: The CSV and the request
faq:
  - q: Which SEC codes can be generated?
    a: "PPD (consumer payroll and debits), CCD (business to business), WEB (internet-authorized debits) and TEL (telephone-authorized debits). One batch per file. CTX and IAT are not generated."
  - q: What does the generator do for me?
    a: "It checks every routing check digit and computes the trace numbers from your bank's routing number, the entry hash, the debit and credit totals and the block count, picks the service class (220, 225, or 200 with an offset) and pads the file to blocks of 10."
  - q: What happens to names with accents or long text?
    a: "Text is converted to upper-case ASCII (ü → UE) and cut to the field width. Both are reported as warnings, so nothing changes silently. Amounts are never rounded."
  - q: My bank wants a balanced file. Is that possible?
    a: "Yes. Send your own account as `offset`; the generator adds the offset entry so debits and credits match."
  - q: Is this tool from Nacha?
    a: "No. It is not affiliated with Nacha."
---

The CSV behind the first sample (made-up names, accounts and routing numbers):

```csv
name,routing,account,amount,account_type,addenda
Maria Lopez,121000358,4400123456,1850.00,checking,October salary
Sam O'Brien,022000062,77-1290,2310.45,savings,October salary
Lee Chen,061000159,9100022,1675.20,checking,
```

The request (the ACH endpoints are coming soon on RapidAPI):

```bash
curl -X POST "https://<host>/v1/ach/generate" -H "Content-Type: application/json" -d '{
  "immediate_destination": "074000010", "immediate_destination_name": "Sample Bank",
  "immediate_origin": "1234567890", "immediate_origin_name": "Acme Payroll Inc",
  "company_name": "Acme Payroll", "company_id": "1234567890",
  "sec_code": "PPD", "description": "PAYROLL", "effective_date": "2026-10-23",
  "entries_csv": "name,routing,account,amount,account_type,addenda\nMaria Lopez,121000358,..."
}' -o payroll.ach
```

The file is returned only after it has passed the same validator as the [NACHA file validator](/tools/nacha-file-validator/).
Entries can also be sent as a JSON list (`entries`) instead of a CSV. The way back works too: `POST /v1/ach/parse?format=csv`
lists the entries of a NACHA file as CSV.

Sample files marked "Moov" are unmodified test files from the open-source [Moov ACH](https://github.com/moov-io/ach)
project ([Apache License 2.0](/assets/demo/LICENSE-moov-ach.txt)). Not affiliated with Nacha.
