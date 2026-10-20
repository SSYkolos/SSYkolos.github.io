---
# Created by: python _tools/new_product.py <url-name> (or copy this file to _products/<url-name>.md).
# The file name becomes the URL: _products/my-tool.md -> /products/my-tool/
# Delete any section you do not need; empty sections are not shown.
title: __TITLE__
order: __ORDER__              # position in lists
category: __CATEGORY__        # a file name in _product_categories/ (finance, manufacturing, sales, ...)
tags: []                      # words people search for: file formats, tasks, industries
featured: false               # true = also shown on the home page (max. 6 there)
kind: __KIND__                # REST API, Chrome extension, Apify actor, ...
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
samples:                      # optional: sample runs, _data/demos/<name>.json + _includes/demos/<name>-sample.html
__LIVE_DEMO__
channels:                     # store links; leave url empty to show "coming soon"
  - name: RapidAPI
    url: ""

features:
  - title: Feature
    text: What it does and why it matters.

specs:
  - label: Inputs
    value: "...  (Markdown allowed, e.g. `code`)"

details_title: Example        # heading for the free text below the front matter
tested:
  - How it was tested.
limits:
  - What it does not do yet.
privacy_summary: One or two sentences. The full notice is _privacy/<same name>.md.
footnote:                     # optional small print at the bottom
---

Free Markdown here: code samples, tables, screenshots (put images in /assets/img/).
