---
title: Terms of Service
permalink: /terms/
eyebrow: Legal
lede: The rules for buying and using the SSY Dynamics APIs.
updated: 2026-10-24
---

## Who we are

{{ site.data.profile.name }} is the trade name of {{ site.data.profile.founder.name }}, a private individual in Hungary, EU
("we", "us"). These terms apply when you buy a plan on this website or use an API key we issued. Contact:
{% include email.html subject="Terms" %}.

## Orders and payment

Our order process is conducted by our online reseller **Paddle.com**. Paddle.com is the Merchant of Record for all
our orders. Paddle provides all customer service inquiries and handles returns. Paddle's
[Buyer Terms](https://www.paddle.com/legal/checkout-buyer-terms) apply to the purchase itself.

- Plans are monthly subscriptions. Prices are shown in USD on the [pricing page]({{ '/pricing/' | relative_url }});
  Paddle adds VAT or sales tax for your country at checkout.
- Usage above a plan's monthly quota is charged at the rates on the pricing page, at the start of the next billing
  month. Where a plan has no overage rate for a unit, requests for that unit stop at the quota until the next month.
- You can cancel at any time from the link in your Paddle receipt. The plan stays active until the end of the period
  you paid for; it is not renewed after that.
- Refunds follow our [refund policy]({{ '/refunds/' | relative_url }}).

## Your API key

- The key is sent to the e-mail address used at checkout. Keep it secret; anyone with the key can use your quota.
- If a key is lost or leaked, write to us and we replace it. The old key stops working.
- We may suspend a key that is used to attack, overload or resell the service, or used after a failed payment.

## What the APIs do, and their limits

- The APIs read, check and convert files (bank statements, payment files, CAD drawings). Each product page states
  what is supported and what is not.
- Results are produced by fixed rules, not by AI. They help you work faster, but **you remain responsible** for
  checking payment files before sending them to a bank, accounting entries before booking them, and quotes before
  sending them to customers. A "valid" result means the file passed our checks; it does not guarantee that a bank
  or authority will accept it.
- We aim for high availability but do not guarantee uninterrupted service. Planned changes that break existing
  integrations are announced by e-mail to active subscribers at least 30 days in advance.

## Your data

Files you send are processed in memory and not stored. Details are in the [privacy notice]({{ '/privacy/' | relative_url }})
and each product's own privacy notice.

## Liability

To the extent the law allows, our total liability for any claim is limited to the amount you paid us in the
12 months before the claim. We are not liable for indirect losses, lost profits or lost data. Nothing in these terms
limits liability that cannot be limited by law, including your rights as a consumer in the EU.

## Changes and law

We may update these terms; the date below shows the latest version, and active subscribers are told about
material changes by e-mail. Hungarian law applies, without removing any mandatory consumer protection of the
country where you live.

<p class="meta">Last updated: {{ page.updated | date: "%B %-d, %Y" }}</p>
