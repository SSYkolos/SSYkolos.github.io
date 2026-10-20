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
| `_tools/` | Scripts that build the product demos (not published) |
| `_data/demos/`, `assets/demo/` | Demo results and downloadable sample files, written by the scripts in `_tools/` |
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

## Product demos ("See it work")

The API pages show the engines' real output for sample files, with CSS-only tabs (no JavaScript).
After changing an engine, rebuild the demo data with that project's own Python, then commit:

```bash
../b2b-statement-reconciler/.venv/Scripts/python _tools/build_reconciler_demo.py
../cad-dxf-bom-api/.venv/Scripts/python _tools/build_dxf_demo.py
```

All names, IBANs and amounts in the samples are fictional.

### Live demo ("Your own file" tab)

Each API has a separate, rate-limited demo service (the same Docker image with `DEMO_MODE=1`; the paid `/v1`
endpoints are closed there). Put its Cloud Run URL in `_config.yml`:

```yaml
demo_api:
  reconciler: https://reconciler-demo-xxxxx.europe-west1.run.app
  dxf: https://dxf-demo-xxxxx.europe-west1.run.app
```

Only then do the "Your own file" tab, the small script `assets/js/live-demo.js`, the privacy-notice sections about
the demo and the matching Content-Security-Policy entry appear. Leave a value empty to switch that demo off.
To test locally, run both images with `-e DEMO_MODE=1` on ports 8081 / 8082 and serve the site with
`jekyll serve --config _config.yml,_config.local.yml` (the local file is git-ignored).

## Messages and bug reports

`feedback_api` in `_config.yml` points to the feedback collector (private repo `SSYkolos/feedback-service`).
With it set, the home page shows a contact form (it also works without JavaScript, via `/thanks/` and
`/thanks/problem/`), and the live demos offer "Send this to the developer" on errors and
"Result doesn't look right?" under results. Run `python triage/triage.py` in `feedback-service` to turn new
reports into private GitHub issues. Leave `feedback_api` empty to switch all of this off.

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
