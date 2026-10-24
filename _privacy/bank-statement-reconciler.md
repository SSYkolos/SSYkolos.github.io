---
title: Bank Statement Reconciler – Privacy Notice
updated: 2026-10-20
description: How the Bank Statement Reconciler API handles the statement files you send.
---

## Summary

The API reads the statement file you send, builds the response and then discards the file. Statements are processed
in memory and never written to disk. No AI or third-party analysis service is involved.

## What is processed

- The statement file or text you send (MT940, MT942, camt.052/053/054 or a ZIP of these) and the request options.
- The response (transactions, balances, audit result) is returned to you and is not kept by the service.

## Optional redaction

With `redact_pii=true`, IBANs, counterparty names and email addresses are masked in the response and the raw bank
text is left out.

{% if site.demo_api.reconciler != "" %}
## Live demo on this website {#live-demo}

When you try your own file on the product page:

- The file is sent over an encrypted connection to a separate demo service on Google Cloud Run in the EU
  (Belgium). It is processed in memory, the result is sent back to your browser, and the file is discarded.
  It is never written to disk or kept, and it is not used for anything else.
- Names, IBANs and email addresses are masked in the result unless you switch that off. The result
  exists only in your browser tab.
- To keep the demo free for everyone, each visitor gets a limited number of runs per day. For this the service
  keeps a counter under a salted hash of your IP address, in memory only. The salt and all counters are replaced
  every day at 00:00 UTC.
- The hosting logs described below apply to the demo service too. There are no cookies and no account.
{%- if site.feedback_api != "" %}
- If a run fails or the result looks wrong, you can send a report to us. The file is included only if you tick the
  box for it; see [Messages and reports]({{ '/privacy/' | relative_url }}#messages).
{%- endif %}
{% endif %}

## Hosting and marketplaces

- The API runs on Google Cloud. Like any web service, the hosting infrastructure keeps standard request logs
  (such as time, IP address and requested URL) for operation and security. File contents are not part of these logs.
- If you use the API through **RapidAPI**, your account, API key and billing are handled by RapidAPI under its own
  privacy policy.
- If you run it as an **Apify Actor**, the files you give as URLs are downloaded for processing, and the results are
  saved to your own Apify storage (dataset and key-value store), which you control, under Apify's terms.

## Contact

Questions about privacy: {% include email.html subject="Bank Statement Reconciler privacy" %}
