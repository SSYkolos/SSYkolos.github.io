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

## Hosting and marketplaces

- The API runs on Google Cloud. Like any web service, the hosting infrastructure keeps standard request logs
  (such as time, IP address and requested URL) for operation and security. File contents are not part of these logs.
- If you use the API through **RapidAPI**, your account, API key and billing are handled by RapidAPI under its own
  privacy policy.
- If you run it as an **Apify Actor**, the files you give as URLs are downloaded for processing, and the results are
  saved to your own Apify storage (dataset and key-value store), which you control, under Apify's terms.

## Contact

Questions about privacy: {% include email.html subject="Bank Statement Reconciler privacy" %}
