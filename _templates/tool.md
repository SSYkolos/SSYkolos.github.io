---
# A free tool / keyword page. Copy to _landing/<url-name>.md -> /tools/<url-name>/
# One task, named the way people search for it ("MT940 to CSV", "DXF cut length calculator").
# It embeds the product's samples and live demo, so the product needs live_demo and/or samples.
# Write only real, checkable statements; say clearly what the demo shows and what only the API does.
title: Short name in search words          # page title and card title
h1: The task as a sentence                 # main heading (defaults to title)
product: bank-statement-reconciler         # the product file name in _products/
order: 9                                   # position among this product's tools
summary: One sentence for the tool cards.
description: One or two sentences for search results (about 150 characters).
lede: Two sentences under the heading: what the visitor can do right here.
try_intro: One sentence above the demo (what the samples show, what happens to the file).
steps:
  - "Where to get the file."
  - "What to do with it here."
  - "What comes out, and what the API adds."
body_title: Heading for the text below
faq:
  - q: A question people really ask?
    a: "A short, exact answer. Markdown works: `code`, **bold**, [links](/products/)."
cta:                                       # optional: text above the button to the product page
---

The explanation: what the output contains, what is checked, what the limits are. Tables work.
