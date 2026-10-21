---
title: ACH return codes explained
h1: ACH return codes (R01–R85) and change codes (C01–C14) explained
product: sepa-payment-api
order: 5
summary: Every ACH return and notification-of-change code in plain words, with what to do next.
description: ACH return codes R01 to R85 and NOC change codes C01 to C14 explained in plain words, with what to do next. The API reads return files and lists each code for you.
lede: A payment came back with R03 or a C02 change notice? The tables below explain every code and what to do next. The last sample tab shows a real return file and the API's answer for it.
try_intro: "The last sample is a return file; open its second JSON answer to see the returns explained. The live demo validates NACHA files; explaining returns is an API call. Please do not upload a real file with real account numbers."
samples: ach
live_demo:
  api: sepa
  plugin: ach
  path: /demo/ach/validate
  accept: ".ach,.txt,.dat,.nacha"
  max_mb: 0.5
  noun: NACHA (ACH) file
  formats: "NACHA · returns and notifications of change too"
steps:
  - "Get the return or notification-of-change file from your bank. Returns carry an addenda record of type 99, change notices one of type 98."
  - "Send it to the API's `POST /v1/ach/returns`."
  - "You get one item per return or change: the code, its meaning, what to do, whether a retry is allowed, the corrected data and the original entry."
body_title: All codes
faq:
  - q: What is the difference between a return and a notification of change?
    a: "A return (R code) means the entry was not posted and the money comes back. A notification of change (C code) means the entry was posted, but some account data was wrong; you must correct it before the next entry to that account."
  - q: Which returns may be sent again?
    a: "R01 (insufficient funds) and R09 (uncollected funds): up to two more times within 180 days of the original effective date. Other returns need a fix or a new authorization first."
  - q: Where does the explanation come from?
    a: "From our own summaries. They follow the public code lists, not the text of the Nacha Operating Rules. This tool is not affiliated with Nacha; for binding wording, see the rules or ask your bank."
  - q: Is my file stored?
    a: "No. It is processed in memory and discarded right after the answer is sent back. See the [privacy notice](/products/sepa-payment-api/privacy/#live-demo)."
---

### Return codes

| Code | Meaning | What to do |
|---|---|---|
{%- for c in site.data.ach_codes.returns %}
| **{{ c.code }}** | {{ c.title }}{% if c.explanation != "" %}: {{ c.explanation }}{% endif %} | {{ c.action }} |
{%- endfor %}

### Change codes (notifications of change)

{{ site.data.ach_codes.noc_action }}

| Code | Meaning | Corrected data |
|---|---|---|
{%- for c in site.data.ach_codes.changes %}
| **{{ c.code }}** | {{ c.title }} | {{ c.fields | join: ", " | default: "–" }} |
{%- endfor %}

The API's answer for one return, from the sample file:

```json
{
  "kind": "return",
  "code": "R01",
  "title": "Insufficient funds",
  "explanation": "The account did not have enough money for the debit.",
  "action": "You may try again up to two more times within 180 days of the original effective date.",
  "retry_allowed": true,
  "original_trace_number": "091400600000001"
}
```

The same codes are available as JSON from `GET /v1/ach/codes` (live [on RapidAPI](https://rapidapi.com/SSYkolos/api/sepa-payment-file)).
Sample files marked "Moov" are unmodified test files from the open-source [Moov ACH](https://github.com/moov-io/ach)
project ([Apache License 2.0](/assets/demo/LICENSE-moov-ach.txt)). Not affiliated with Nacha.
