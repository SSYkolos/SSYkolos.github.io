---
title: SEPA & NACHA Payment File API – Privacy Notice
updated: 2026-10-21
description: How the SEPA & NACHA Payment File API handles the payment data and files you send.
---

## Summary

The API reads the order or file you send, builds the response and then discards the input. Everything is processed
in memory and never written to disk. No AI or third-party analysis service is involved.

## What is processed

- The payment order you send (JSON or CSV with names, IBANs, BICs, addresses, amounts and references), or the
  payment file (pain.001, pain.008, NACHA/ACH with routing and account numbers) or bank status report (pain.002, ACH
  returns), and the request options.
- The response (the generated or converted file, the validation report or the status summary) is returned to you
  and is not kept by the service.

{% if site.demo_api.sepa != "" %}
## Live demo on this website {#live-demo}

When you try your own file on the product page or on a tool page (SEPA or NACHA):

- The file is sent over an encrypted connection to a separate demo service on Google Cloud Run in the EU
  (Belgium). It is validated in memory, the report is sent back to your browser, and the file is discarded.
  It is never written to disk or kept, and it is not used for anything else.
- The report exists only in your browser tab.
- To keep the demo free for everyone, each visitor gets a limited number of runs per day. For this the service
  keeps a counter under a salted hash of your IP address, in memory only. The salt and all counters are replaced
  every day at 00:00 UTC.
- The hosting logs described below apply to the demo service too. There are no cookies and no account.
{%- if site.feedback_api != "" %}
- If a run fails or the result looks wrong, you can send a report to me. The file is included only if you tick the
  box for it; see [Messages and reports]({{ '/privacy/' | relative_url }}#messages).
{%- endif %}
{% endif %}

## Hosting and marketplaces

- The API runs on Google Cloud. Like any web service, the hosting infrastructure keeps standard request logs
  (such as time, IP address and requested URL) for operation and security. File contents are not part of these logs.
- If you use the API through **RapidAPI**, your account, API key and billing are handled by RapidAPI under its own
  privacy policy.

## Contact

Questions about privacy: {% include email.html subject="SEPA & NACHA Payment File API privacy" %}
