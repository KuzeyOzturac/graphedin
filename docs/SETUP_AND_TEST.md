# Setup and test — version 1.1.0

## Keyless use on GitHub Pages

No installation or API key is required.

1. Enter the company name and click **Research company**.
2. Select a search focus: all roles, leadership, directors/heads, or managers/leads.
3. Open Google or Bing using the generated query. LinkedIn search is also available and may ask you to sign in on LinkedIn itself.
4. Copy public results containing names, titles and profile links. Normal browser copying can preserve links as rich clipboard content.
5. Paste into GraphEdIn and click **Preview extracted people**.
6. Deselect unrelated people and previous employees. Check uncertain roles against their profiles.
7. Click **Build graph from selected people**. Reporting lines remain unknown; use explicit editing or optional dashed suggestions.
8. Repeat for another role focus. Results for the same company merge, duplicates are skipped, and existing edits are preserved.

For plain text or spreadsheets, use `Name [tab] Role [tab] LinkedIn profile URL [tab] Department`, one person per row. Bare URLs without names are not converted into fabricated people. An unrecognized paste produces an error instead of a sample graph. Clipboard content is processed in the browser and isn't uploaded.

**Research company** uses this workflow whenever Connection settings are blank. Optional automatic search does not need to be configured to use the app.

## 1. Local development

1. Clone the repository and open it in VS Code.
2. Install Node.js 22 or newer.
3. Copy `.env.example` to `.env`. Leave search settings blank for paste research; optionally set `SEARXNG_URL` for automatic keyless search or `BRAVE_SEARCH_API_KEY` for Brave.
4. Run `node --env-file=.env server/index.js` in the repository root.
5. Open http://localhost:3000. Connection settings should be blank, which uses the same-origin local API.
6. Run `npm run check`, `npm test`, and `npm run build`.

Do not commit `.env`, paste keys into the frontend, or put keys in `config.json`.

## 2. GitHub Pages frontend

1. Open repository **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Run **Actions → Test and deploy GitHub Pages → Run workflow**, or push a commit to `main`.
4. Confirm both build and deploy jobs succeed.
5. Use the deployment URL reported by the workflow. For the normal public project-site configuration, the expected URL is https://kuzeyozturac.github.io/graphedin/.

If Pages is unavailable because the repository is private, a supporting GitHub plan or an explicit decision to make the repository public is needed. Do not change repository visibility accidentally. The workflow deliberately does not pretend its default token can enable an administrative Pages setting.

## 3. Live discovery backend

GitHub Pages serves static files. For optional automatic discovery, deploy one of these adapters separately. Keyless paste research already works without them.

### Option A: Node hosting

- Runtime: Node.js 22+.
- Start command: `node server/index.js`.
- For automatic keyless discovery, set `SEARXNG_URL` to a SearXNG instance you own with JSON search enabled. Alternatively set `BRAVE_SEARCH_API_KEY` as a hosting secret.
- Set `ALLOWED_ORIGINS=https://kuzeyozturac.github.io` (origin only, no `/graphedin/` path).
- Use the port supplied by the host via `PORT`.
- Enable HTTPS. Set the backend URL in frontend Connection settings.
- Health check: `GET /api/health` returns `{ "configured": true }`.

The Node adapter rate-limits by socket address. Reverse proxies may cause users to share a limit. If changing this, only trust IP headers set and overwritten by your hosting platform. The process cache holds up to 100 company queries for 15 minutes and disappears on restart. Multiple instances have independent caches and rate limits.

### Option B: Cloudflare Worker

`server/worker.js` and `wrangler.jsonc` are included. For SearXNG, configure `SEARXNG_URL` as a Worker variable; no Brave secret is needed. For Brave, use the secret command below. In an authenticated Cloudflare environment:

```sh
npx wrangler secret put BRAVE_SEARCH_API_KEY
npx wrangler deploy
```

Before deploying, confirm `ALLOWED_ORIGINS` and use a rate-limiter namespace appropriate to your account. The configured simple limiter permits 10 requests per IP per minute. If the binding is missing, discovery fails closed with a configuration error. Use the returned workers.dev HTTPS origin in Connection settings. The API response cache expires after 15 minutes.

CORS is a browser origin restriction, **not authentication**. Both adapters are public APIs intended for a small deployment. Provider cost controls and hosting-level abuse protection should be configured for wider use. A production multi-user service should add server-side authentication, per-account quotas and shared rate limiting before scaling. No LinkedIn account access is needed.

### Shared frontend setting

To configure a common endpoint for all users, change only:

```json
{"apiBaseUrl":"https://your-deployed-api.example"}
```

in `config.json`, then push to redeploy. This is a public URL, never an API secret. Browser Connection settings override the shared default.

## 4. Manual acceptance tests

1. **Example:** Load the example. Confirm the banner and graph label say it is fictional. Eight people should appear.
2. **Navigation:** Pan empty canvas space; zoom using controls and wheel; fit the graph. Focus the canvas and use arrows, `+`, `-`, and `0`.
3. **Filters:** Search a name or role and filter Engineering. Clear filters to restore everyone.
4. **Inspector:** Select a person from the list or graph. Confirm role and reporting status are visible.
5. **Editing:** Add a person and manager. A self-link or circular reporting chain must be rejected. A confirmed relationship without evidence must be rejected.
6. **Suggestions:** Toggle title-based suggestions. Dashed links remain explicitly unverified. Export JSON must not silently save these display-only suggestions.
7. **Imports:** Export JSON, clear the workspace, import the file. People and stored relationships should round-trip. Duplicate IDs and unsafe profile URLs must not create script execution.
8. **SVG:** Export SVG; open it independently. Nodes, line styles and the legend should be visible.
9. **Persistence:** Reload. Workspace and backend URL should restore in this browser.
10. **Live search:** With the backend configured, enter the full company name. Inspect LinkedIn links and excerpts; verify current employment manually. No solid reporting lines should be generated automatically.
11. **Failures:** Missing key, unavailable API, no results, and provider rate limits must produce clear messages. A failed request must not replace existing work with fictional data.
12. **Mobile:** At 390 px width, controls should be reachable, directory horizontally scrollable, and the inspector below the graph. Test touch panning on a real device.

Also test the keyless flow with pasted text, rich hyperlinks, tab-separated rows, duplicate batches and deselected candidates. Confirm neither a bare URL nor an unrelated non-LinkedIn link becomes a person.

Automated checks cover the model, pasted-research parser, merge behavior, provider adapters and HTTP boundary. Real-provider search and deployment require your actual service credentials and hosting access. Browser visual QA is a separate check.

## Self-hosted SearXNG requirements

Use your own instance, not an arbitrary shared public instance. Enable JSON in `search.formats` in its `settings.yml`; otherwise the endpoint can return 403. The GraphEdIn backend sends `GET /search?q=...&format=json&categories=general` and maps `results[].content` to source excerpts. No search API key is sent. Upstream engines can still throttle requests; a blocked HTML response is treated as an error, not zero matches.

Documentation: https://docs.searxng.org/dev/search_api.html
