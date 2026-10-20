# ssykolos.github.io

Personal website of Kolos Hetyéssy: products, privacy policies, contact, and later projects and CV.
Built by GitHub Pages' built-in Jekyll. No local build step, no JavaScript, no external requests.
This repository contains only the website, no product source code.

## Where things are

| Path | What it is |
|---|---|
| `_data/profile.yml` | Name, role, location, **contact email**, profile links: used on every page |
| `_data/navigation.yml` | Main menu. An item only shows when its page or collection exists |
| `_products/*.md` | One file per product → `/products/<file-name>/` |
| `_privacy/*.md` | Privacy notice per product → `/products/<file-name>/privacy/` |
| `_projects/*.md` | Projects / case studies → `/projects/<file-name>/` (none yet: the menu item stays hidden) |
| `about.md` | About / CV page, hidden until `published: true` |
| `privacy.md` | Privacy of this website itself |
| `_templates/` | Copy-ready starting files for a new product or project (not published) |
| `_layouts/`, `_includes/` | Page frames and reusable pieces (header, footer, cards, figures) |
| `assets/css/site.css` | All styling. Colours are variables at the top; dark mode follows the system |
| `assets/fonts/` | IBM Plex Sans / Mono, self-hosted (SIL Open Font License) |

## Common changes

- **Set the contact email:** fill in `email:` in `_data/profile.yml`. It appears everywhere at once
  (footer, contact section, privacy policies).
- **Add a store link:** in the product's file under `channels:`, set `url:`. The "coming soon" button becomes a real link.
- **Add a product:** copy `_templates/product.md` to `_products/<name>.md`, and add `_privacy/<name>.md`.
- **Add a project:** copy `_templates/project.md` to `_projects/<name>.md`. The Projects menu item and home section appear by themselves.
- **Publish the About/CV page:** edit `about.md`, set `published: true`.
- **Add a page:** create `<name>.md` with `title:` and `permalink: /<name>/`, then add it to `_data/navigation.yml`.

Every push to `main` rebuilds the site in about a minute.

## Stable URLs (do not rename)

- `/products/maps-lead-extractor/privacy/`: registered in the Chrome Web Store
- `/products/bank-statement-reconciler/privacy/`, `/products/dxf-quote-api/privacy/`: for marketplace listings

## Adding a custom domain later

1. At the domain registrar, add DNS records for the apex domain (`example.com`): four `A` records to
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   (and optionally `AAAA` records to `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`),
   plus a `CNAME` record for `www` pointing to `ssykolos.github.io`.
2. Recommended first: verify the domain for your account (GitHub → Settings → Pages → *Add a verified domain*).
3. Repository → Settings → Pages → *Custom domain*: enter the domain and save. GitHub creates a `CNAME` file in the repo.
4. When the DNS check passes, tick **Enforce HTTPS**.
5. Change `url:` in `_config.yml` to `https://example.com`.

Old `ssykolos.github.io` links are redirected to the new domain automatically, so URLs already given to the
Chrome Web Store keep working. Check GitHub's current guide before starting:
<https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site>

## Preview locally (optional)

With Docker installed:

```bash
docker run --rm -p 4000:4000 -v "$PWD:/site" -w /site ruby:3.3 sh -c "gem install github-pages webrick --no-document && jekyll serve --host 0.0.0.0"
```

Then open <http://localhost:4000>.
