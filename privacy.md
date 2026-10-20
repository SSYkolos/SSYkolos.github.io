---
title: Privacy
permalink: /privacy/
eyebrow: Privacy
lede: This website does not collect anything about you.
updated: 2026-10-20
---

{% assign has_live = false %}{% for api in site.demo_api %}{% if api[1] != "" %}{% assign has_live = true %}{% endif %}{% endfor -%}
{% if has_live -%}
- **No cookies, no analytics, no tracking.** The only JavaScript on this site runs the live demo on the API
  product pages, and it does something only when you choose a file there.
{% else -%}
- **No cookies, no analytics, no tracking.** The site contains no JavaScript.
{% endif -%}
- **No third-party resources.** Fonts, styles and images are served from this site itself, so your browser does not
  contact Google Fonts, CDNs or social networks when you read it.
- **Hosting.** The site is hosted on GitHub Pages. GitHub may log visitors' IP addresses for security purposes; see
  the [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).
{% if has_live -%}
- **Live demos.** A file you try in a live demo is sent to that product's demo service, processed in memory and
  discarded. Details are in each product's privacy notice below.
{% endif -%}
- **Email.** If you write to me, I use your message and address only to reply.

## Product privacy

{% assign products = site.products | sort: "order" -%}
{%- for p in products -%}
{%- assign privacy_url = p.url | append: "privacy/" -%}
{%- assign doc = site.privacy | where: "url", privacy_url | first -%}
{%- if doc %}
- [{{ doc.title }}]({{ doc.url | relative_url }})
{%- endif -%}
{%- endfor %}

## Contact

{% include email.html subject="Privacy" %}

<p class="meta">Last updated: {{ page.updated | date: "%B %-d, %Y" }}</p>
