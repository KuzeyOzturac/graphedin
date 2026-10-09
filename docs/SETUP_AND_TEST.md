# GraphEdIn v1.2 — owner setup and verification

## Required experience

A visitor enters a company name and clicks Generate graph. The app discovers profile candidates and builds the graph without search tabs, clipboard steps, API keys or connection settings. Editing and importing are optional tools, not generation prerequisites.

## Current production dependency

The frontend is on GitHub Pages. Automatic discovery needs a separately deployed server and configured search provider. `config.json` is currently empty, so live discovery is not operational. Configure this once as the owner; do not ask visitors to do it.

## Local setup

1. Install Node.js 22 or newer, open the repo in VS Code and run `cp .env.example .env`.
2. Set either `BRAVE_SEARCH_API_KEY` or an owner-hosted `SEARXNG_URL` with JSON enabled in `.env`. No LinkedIn API key is required. A SearXNG service still needs its own hosting.
3. Run `node --env-file=.env server/index.js` and open http://localhost:3000.
4. Enter a company with indexed public profiles. The app automatically displays candidates and dashed inferred relationships.

## Production setup

Deploy `server/index.js` to a Node host, or `server/worker.js` using the supplied Wrangler configuration. Set server environment variables; never commit secrets. For Worker, configure `RATE_LIMITER`. Allow `https://kuzeyozturac.github.io` in `ALLOWED_ORIGINS`.

Set `config.json` to `{"apiBaseUrl":"https://YOUR-API-ORIGIN"}`, commit, and allow the Pages workflow to deploy. Visitors receive this connection automatically. No visitor setup exists.

Check `/api/health` reports `configured: true`; then request `/api/discover?company=Microsoft` from the frontend origin. Health alone does not prove the provider works. Verify real names, LinkedIn URLs, excerpts and a visible graph. Test a second company to ensure results change. Provider or CORS errors must be fixed before calling automatic discovery deployed.

## Checks

Run `npm run check`, `npm test`, and `npm run build`. Tests cover request configuration, missing-service errors, provider failures, multi-query aggregation, company-mention filtering, source deduplication, graph validation and HTTP boundaries. Provider test fixtures establish behavior, not live search availability.

With no API configured, submit a company: the app must show a site-owner configuration error, keep any prior chart and never open manual-research or load demo people. The separate fictional example remains labeled.

With a live provider, submit a company and confirm no extra input is requested. Failed scoped queries should disclose partial coverage. Inspect dashed links: they are title-based guesses and must never become solid verified facts automatically.
