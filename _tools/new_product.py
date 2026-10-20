"""
Create the files for a new product, then print what is left to do.

    python _tools/new_product.py invoice-parser --title "Invoice Parser API" --category finance --kind "REST API" --live

Creates (never overwrites):
    _products/<name>.md                 the product page (from _templates/product.md)
    _privacy/<name>.md                  its privacy notice (to be completed)
    assets/js/demos/<name>.js           with --live: the product part of the live demo
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]

LIVE_BLOCK = """live_demo:                    # the "Your own file" tab; needs a demo service (see README)
  api: {api}                  # key in _config.yml demo_api
  path: /demo/...             # the service's demo endpoint
  accept: ".ext"
  max_mb: 2
  noun: file
  formats: "Format A · Format B"
  options: []                 # e.g. - type: checkbox | text, param: ..., label: ..."""

PRIVACY = """---
title: {title} – Privacy Notice
updated: {today}
description: How {title} handles the data you send.
---

<!-- TODO: describe exactly what is processed, stored and for how long. Use the other notices as a model. -->

## Summary

## What is processed

## Hosting and marketplaces

## Contact

Questions about privacy: {{% include email.html subject="{title} privacy" %}}
"""


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("name", help="URL name: lowercase letters, digits and hyphens")
    ap.add_argument("--title", required=True)
    ap.add_argument("--category", required=True, help="a file name in _product_categories/")
    ap.add_argument("--kind", default="REST API")
    ap.add_argument("--live", action="store_true", help="add a live demo block and its JavaScript file")
    args = ap.parse_args()

    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,59}", args.name):
        sys.exit("The name must be lowercase letters, digits and hyphens, e.g. invoice-parser.")
    product = SITE / "_products" / f"{args.name}.md"
    privacy = SITE / "_privacy" / f"{args.name}.md"
    plugin = SITE / "assets" / "js" / "demos" / f"{args.name}.js"
    for path in (product, privacy) + ((plugin,) if args.live else ()):
        if path.exists():
            sys.exit(f"{path.relative_to(SITE)} already exists; nothing was changed.")

    categories = sorted(p.stem for p in (SITE / "_product_categories").glob("*.md"))
    new_category = args.category not in categories
    orders = [int(m.group(1)) for p in (SITE / "_products").glob("*.md")
              for m in [re.search(r"^order:\s*(\d+)", p.read_text(encoding="utf-8"), re.M)] if m]
    from datetime import date

    text = (SITE / "_templates" / "product.md").read_text(encoding="utf-8")
    text = (text.replace("__TITLE__", args.title).replace("__ORDER__", str(max(orders, default=0) + 1))
                .replace("__CATEGORY__", args.category).replace("__KIND__", args.kind)
                .replace("__LIVE_DEMO__", LIVE_BLOCK.format(api=args.name) if args.live else "live_demo:                    # optional: see python _tools/new_product.py --help"))
    text = re.sub(r"^# Created by:.*\n# The file name.*\n# Delete any.*\n", "", text, flags=re.M)
    product.write_text(text, encoding="utf-8")
    privacy.write_text(PRIVACY.format(title=args.title, today=date.today().isoformat()), encoding="utf-8")
    created = [product, privacy]
    if args.live:
        plugin.parent.mkdir(parents=True, exist_ok=True)
        plugin.write_text((SITE / "_templates" / "demo-plugin.js").read_text(encoding="utf-8")
                          .replace("__TITLE__", args.title).replace("__SLUG__", args.name), encoding="utf-8")
        created.append(plugin)

    print("Created:")
    for p in created:
        print("  " + str(p.relative_to(SITE)).replace("\\", "/"))
    print("\nStill to do:")
    steps = [f"Write the texts in _products/{args.name}.md (only real, checkable facts) and the privacy notice."]
    if new_category:
        steps.append(f"Category '{args.category}' does not exist yet: add _product_categories/{args.category}.md "
                     "(title, order, summary), or use one of: " + ", ".join(categories))
    if args.live:
        steps += [
            "Add DEMO_MODE support to the API (copy web_demo.py from an existing API) and deploy it as <name>-demo.",
            f"Put its URL in _config.yml under demo_api: {args.name}: https://...",
            f"Fill in live_demo in the product file and render() in assets/js/demos/{args.name}.js.",
        ]
    steps += [
        f"feedback-service/triage/config.json: add \"{args.name}\" with its private repo (and engine_dir for reproduction).",
        "Preview locally, check desktop and phone width, then commit and push.",
    ]
    for i, s in enumerate(steps, 1):
        print(f"  {i}. {s}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
