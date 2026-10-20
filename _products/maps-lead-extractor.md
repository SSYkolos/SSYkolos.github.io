---
title: Maps Lead Extractor
order: 3
category: sales
tags: [google maps, leads, csv, email finder, b2b, chrome extension]
featured: true
kind: Chrome extension
status: Launching soon
tagline: "Export Google Maps businesses to CSV: phone, website, address, rating, plus emails and social profiles from the businesses' own websites."
summary: Turns a Google Maps search into a clean lead list, then finds emails and social profiles on each business website. Runs entirely in your browser.
description: Chrome extension that exports Google Maps search results to CSV and JSON, and finds emails and social profiles on the businesses' websites. Runs entirely in the browser.
io:
  in: Google Maps search results
  out: CSV · JSON
fact:
  value: "0"
  label: leads sent to any server of ours. Everything stays in your browser
visual: columns
channels:
  - name: Chrome Web Store
    url: ""

features:
  - title: Complete data, not just what the card shows
    text: The extension reads the data behind the result list, so phone, website and full address are exported even when a result card does not display them.
  - title: Falls back by itself
    text: If Google changes its data format, the extension switches to reading the result cards and says so in the side panel.
  - title: No duplicates
    text: Leads are matched by Google's place ID, so repeated or overlapping searches merge cleanly.
  - title: Emails and social profiles
    text: Visits each business website (homepage, contact and imprint pages) to find public email addresses, including Cloudflare-protected ones, plus LinkedIn, Facebook, Instagram, X, YouTube and TikTok profiles.
  - title: Multi-search queue
    text: Paste a list of searches, for example one per district, to get past the roughly 120 results Google Maps shows per search. (Pro)
  - title: Excel-ready export
    text: UTF-8 CSV with correct accents, an optional semicolon delimiter for European Excel, and phone numbers kept as text.

specs:
  - label: Per result
    value: Name, all categories, rating, review count, phone (local and international), address split into street, postal code, city, district and country, website, weekly opening hours, coordinates, place ID, CID
  - label: From websites
    value: Email addresses; LinkedIn, Facebook, Instagram, X, YouTube and TikTok profiles
  - label: Export
    value: CSV (UTF-8, comma or semicolon); JSON in Pro
  - label: Languages
    value: Works in any Google Maps language; tested live on English, German, French and Hungarian
  - label: Runs
    value: 100 % in the browser. Chrome Manifest V3, no account, no backend

details_title: Free and Pro
tested:
  - Automated tests for the data parser, the card parser, merge rules, email extraction and licensing.
  - Tested live on English, German, French and Hungarian Google Maps.
limits:
  - Google Maps shows about 120 results per search, and fewer when you are not signed in to Google. Multi-search is the way around it.
  - Keep the Google Maps tab visible while extracting. Chrome pauses background tabs.
  - Google can change its page at any time. The extension falls back to the result cards, but a larger change may need an update.
  - Contact details can be personal data. You are responsible for using them lawfully, for example under the GDPR and the anti-spam rules for cold email in your country.
privacy_summary: The extension works entirely inside your browser. There is no server that receives your data, no user account, and the leads you extract are never seen, collected, sold or shared by us.
footnote: Maps Lead Extractor is an independent tool and is not affiliated with, endorsed by or sponsored by Google. Google Maps is a trademark of Google LLC.
---

| | Free | Pro |
|---|---|---|
| Extract and preview results | unlimited | unlimited |
| Full data per result (address parts, opening hours, all categories, international phone) | ✓ | ✓ |
| CSV export, all columns, nothing masked | 50 rows per export | unlimited, plus JSON |
| Email and social profile search on websites | 25 websites | unlimited |
| Multi-search queue | – | ✓ |

Pro is activated with a license key in the extension's side panel.
