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

## Hosting and marketplaces

- The API runs on Google Cloud. Like any web service, the hosting infrastructure keeps standard request logs
  (such as time, IP address and requested URL) for operation and security. File contents are not part of these logs.
- If you use the API through **RapidAPI**, your account, API key and billing are handled by RapidAPI under its own
  privacy policy.

## Contact

Questions about privacy: {% include email.html subject="CAD DXF Quote API privacy" %}
