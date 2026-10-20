---
title: CAD DXF Quote API – Privacy Notice
updated: 2026-10-20
description: How the CAD DXF Quote API handles the drawings you send.
---

## Summary

The API reads the DXF drawing you send, calculates the response and then discards the file. Drawings are processed in
memory and never stored. No AI or third-party analysis service is involved.

## What is processed

- The DXF file or text you send and the request options (for example layer filters).
- The response (measurements, BOM, warnings and the optional SVG preview) is returned to you and is not kept by the
  service.

{% if site.demo_api.dxf != "" %}
## Live demo on this website {#live-demo}

When you try your own file on the product page:

- The file is sent over an encrypted connection to a separate demo service on Google Cloud Run in the EU
  (Belgium). It is processed in memory, the result is sent back to your browser, and the file is discarded.
  It is never written to disk or kept, and it is not used for anything else.
- The result, including the preview of your drawing, exists only in your browser tab.
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

Questions about privacy: {% include email.html subject="CAD DXF Quote API privacy" %}
