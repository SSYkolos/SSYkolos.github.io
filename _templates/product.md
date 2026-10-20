---
# Copy this file to _products/<url-name>.md (lowercase, hyphens). The file name becomes the URL:
# _products/my-tool.md -> /products/my-tool/
# Delete any section you do not need; empty sections are not shown.
title: Product name
order: 4                      # position in lists
kind: REST API                # or "Chrome extension", "Desktop app", ...
status: Launching soon
tagline: One or two sentences shown at the top of the page.
summary: One sentence for the product cards.
description: One sentence for search engines.
io:
  in: What goes in
  out: What comes out
fact:                         # one real, checkable number for the card
  value: "100 %"
  label: what the number means
visual:                       # optional: name of a file in _includes/visuals/ (without .html)
channels:                     # store links; leave url empty to show "coming soon"
  - name: RapidAPI
    url: ""

features:
  - title: Feature
    text: What it does and why it matters.

specs:
  - label: Inputs
    value: "...  (Markdown allowed, e.g. `code`)"

details_title: Example          # heading for the free text below the front matter
tested:
  - How it was tested.
limits:
  - What it does not do yet.
privacy_summary: One or two sentences. Add a matching file in _privacy/ with the same name for the full notice.
footnote:                     # optional small print at the bottom
---

Free Markdown here: code samples, tables, screenshots (put images in /assets/img/).
