---
title: Privacy
permalink: /privacy/
eyebrow: Privacy
lede: This website does not collect anything about you.
updated: 2026-10-21
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
- **Where visits come from.** If you open the site through a link that ends in `?ref=` and a short word (for
  example from a forum post), your browser tab remembers that word until you close the tab (sessionStorage, not a
  cookie) and sends it with your demo runs. Each demo service writes one log line per run with the product, that
  word, the file format and whether it worked. It contains no IP address, file name or file content, so it tells me
  which community found the demo, not who you are.
{% endif -%}
{% if site.feedback_api != "" -%}
- **Messages and reports.** What you send with the contact form or the "Send this to the developer" button is
  stored privately. Details are in the next section.
{% endif -%}
- **Email.** If you write to me, I use your message and address only to reply.

{% if site.feedback_api != "" %}
## Messages and reports {#messages}

When you use the contact form, or send a report from a live demo:

- **What is stored:** the type of message, the product, your words, and the e-mail address and name only if you
  give them. A demo report also contains technical details about the run (for example the error code, the file
  format and the file's name and size); the page shows exactly which before you send.
- **Files:** a file is sent only if you tick the box for it. Files are deleted automatically after 30 days.
- **Where:** in a private Google Cloud Storage bucket in the EU (Belgium). The service that receives messages can
  only add new ones; only I can open them. Messages are deleted automatically after 180 days at the latest.
- **How I process them:** I group reports by problem and keep track of them in my private issue tracker on
  GitHub. A file that shows a bug may become a test case; before that, names, account numbers, e-mail addresses
  and similar details are replaced with made-up values. To reproduce a problem, the file is downloaded to my own
  computer for the run and deleted right after; the original is never put into the issue tracker or the code.
- **What it is used for:** answering you, and fixing and improving the products. Nothing is sold or shared,
  and nothing is used for marketing.
- **Quotes:** praise is shown on this website only if you ticked "You may quote this", and I remove it whenever
  you ask.
- **Limits:** to stop spam, the service counts messages per visitor per day under a salted hash of the IP address,
  in memory only, reset daily at 00:00 UTC.

To have a message or file deleted earlier, send a message with its reference number.
{% endif %}

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
