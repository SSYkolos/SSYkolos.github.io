---
title: Structured address converter
h1: Convert a free-text address to an ISO 20022 structured address
product: sepa-payment-api
order: 4
summary: Split a postal address into StrtNm, BldgNb, PstCd, TwnNm and Ctry for SEPA and Swift payments, or into a hybrid address when that is all that is certain.
description: Free ISO 20022 structured address converter for SEPA (pain.001, pain.008) and Swift payments. Postal-code formats and street order for 26 countries, hybrid addresses, and a review flag instead of guesses.
lede: Type one postal address below. You get the ISO 20022 structured address (street, building number, postal code, town, country) as SEPA and Swift payments expect it, or a hybrid address when only the town and country are certain.
try_intro: "The demo uses the same rules as the API. Your text is read in memory and discarded right after. Please use a company or test address, not a private person's."
live_demo:
  api: sepa
  plugin: address
  path: /demo/address
  input: text
  max_mb: 0.001
  noun: postal address
  formats: "One address; separate its parts with commas or line breaks."
  placeholder: "Kerkstraat 7 bus 3, 2000 Antwerpen"
  button: Split the address
  options:
    - type: text
      param: country
      label: Country
      hint: "Two-letter ISO code, e.g. DE, NL, GB. Not needed when the address ends with the country name."
      placeholder: "BE"
steps:
  - "Copy an address from your vendor or customer list, the way it is stored: one line, or several lines separated by commas."
  - "Add the two-letter country code, unless the address already ends with the country."
  - "Read the result: every ISO 20022 element with its value, the form (structured or hybrid) and the confidence. Unclear addresses are marked for review instead of guessed."
body_title: The rules
faq:
  - q: When do SEPA payments need structured addresses?
    a: "The EPC planned to stop accepting unstructured addresses (address lines only) on 15 November 2026. On 9 September 2026 it postponed that date; the new one is not set yet. Swift postponed its November 2026 date for cross-border payments on 27 August 2026 and expects to announce more by December 2026. Structured and hybrid addresses are accepted today, and the hybrid form has no end date."
  - q: What is a hybrid address?
    a: "Town (`TwnNm`) and country (`Ctry`) in their own fields, plus one or two free-text address lines of up to 70 characters. Whatever is available in structured form must go into the structured elements and must not be repeated in the lines (EPC guidance EPC153-22)."
  - q: Which countries are supported?
    a: "Austria, Belgium, Croatia, the Czech Republic, Denmark, Finland, France, Germany, Hungary, Ireland, Italy, Liechtenstein, Luxembourg, Monaco, the Netherlands, Norway, Poland, Portugal, Romania, Slovakia, Slovenia, Spain, Sweden, Switzerland, the United Kingdom and the United States. Other countries are always marked for review."
  - q: Does it check that the address exists?
    a: "No. It checks the format and the order (postal code pattern, street before or after the number, where the town stands). It has no postal database, so a postal code that does not belong to the town is not noticed."
  - q: Can it fix a whole payment file or vendor list?
    a: "Yes, through the [API](/products/sepa-payment-api/): `fix-file` rewrites the payer and payee addresses of a pain.001 or pain.008 and returns a change report, and `parse-csv` adds the structured columns and a status to every row of a CSV."
---

| Form | `TwnNm` + `Ctry` | Other structured elements | `AdrLine` |
|---|---|---|---|
| Structured | required | as many as available | not allowed |
| Hybrid | required | allowed | 1–2 lines, 70 characters each, not repeating the structured parts |
| Unstructured | – | only `Ctry` | 1–2 lines; postponed end date, see above |

Lengths from the ISO 20022 schema: `TwnNm` 35, `StrtNm` 70, `BldgNb` 16, `PstCd` 16, `PstBx` 16, `AdrLine` 70.
Sources: EPC guidance document EPC153-22 v2.0, the EPC SEPA credit transfer customer-to-PSP implementation
guidelines 2025 (address of the originator and of the beneficiary), and the EPC announcement of 10 September 2026.

| Result | Meaning | In file mode |
|---|---|---|
| structured, high | every part found its element, the postal code matches the country's format | applied |
| hybrid, medium | town, country and postal code are certain; the rest (flat, floor, c/o …) stays in an address line | applied |
| review, low | no postal code, two possible towns, a field too long, or an unknown country | left as it is, listed for manual review |
