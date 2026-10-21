# Measuring where demo runs come from

Every link you post gets `?ref=<channel>`. The live-demo script keeps that word for the browser tab
(sessionStorage, no cookie, no banner) and sends it as `X-Client-Ref` with every demo run. The demo services
(`reconciler-demo`, `dxf-demo`, `sepa-demo`, which also serves NACHA/ACH) write one JSON log line per run:

```json
{"message": "demo_call", "product": "reconciler", "ref": "devto", "format": "MT940", "ok": true, "error": null}
```

`product` is `reconciler`, `dxf`, `sepa` or `ach`. `ref` is cleaned to `a-z 0-9 _ -`, at most 40 characters;
`none` means the visitor did not come through a ref link. No IP address, file name or file content is logged.
Only real demo runs count: a page view without a file is not logged.

## Weekly count (last 7 days)

Git Bash:

```bash
gcloud logging read 'resource.type="cloud_run_revision" AND jsonPayload.message="demo_call"' --project api-products-512203 --freshness=7d --limit=10000 --format='csv[no-heading](jsonPayload.ref,jsonPayload.product,jsonPayload.ok)' | sort | uniq -c | sort -rn
```

PowerShell:

```powershell
gcloud logging read 'resource.type="cloud_run_revision" AND jsonPayload.message="demo_call"' --project api-products-512203 --freshness=7d --limit=10000 --format='csv[no-heading](jsonPayload.ref,jsonPayload.product,jsonPayload.ok)' | Group-Object | Sort-Object Count -Descending | Format-Table Count, Name
```

Each output row is `count  ref,product,ok`, for example `12  reddit_cnc,dxf,True`. `ok=False` rows are files the
engine could not read (the `error` field says why: run the same command with `jsonPayload.error` added to the
format to see the codes). Cloud Logging keeps these lines for 30 days by default, so count every week.

## The ref names in use

| Where | ref |
| --- | --- |
| r/de_EDV | `reddit_de_edv` |
| r/PlainTextAccounting | `reddit_pta` |
| r/lasercutting | `reddit_lasercutting` |
| r/CNC | `reddit_cnc` |
| r/Netsuite | `reddit_netsuite` |
| community.n8n.io | `n8n_forum` |
| DEV.to | `devto` |
| Show HN | `show_hn` |

Add new ones freely: any lowercase word works, nothing needs to be configured.
