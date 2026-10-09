# GraphEdIn

Company people graphs sourced from publicly indexed LinkedIn profiles. Enter a company name, inspect profile evidence, explore title-based hierarchy suggestions, and edit reporting relationships.

## What is implemented

- Live company-name discovery through the Brave Search API, restricted to LinkedIn `/in/` URLs.
- Interactive SVG graph with pan, zoom, fit, keyboard navigation, department filters and people search.
- Profile inspector with LinkedIn link, search excerpt, and observation date.
- Optional dashed title-based reporting suggestions. No reporting relationships are invented as confirmed facts.
- Add/edit/remove people and reporting relationships, with evidence required for user-confirmed lines.
- JSON import/export, standalone SVG export, browser-local persistence and a clearly labeled fictional example.
- Dependency-free Node backend and optional Cloudflare Worker adapter. API keys stay server-side.
- Validation for cycles, duplicate IDs, missing managers, unsafe profile URLs and oversized imports.
- Test/build/deploy workflow for GitHub Pages.

## Important scope

This is **search-index research**, not a LinkedIn employee directory API. Search finds up to 20 indexed profile candidates per query; it cannot guarantee full coverage, current employment, or accurate titles. The parser retains excerpts for review. LinkedIn sign-in, session cookies, and authenticated scraping are not used. Company names can be ambiguous. The user must check each profile and remove unrelated or former employees.

Public profile titles do not establish who reports to whom. Nodes are placed by title seniority; inferred links are disabled by default and visibly dashed when enabled. Solid lines mean **user-confirmed with supplied evidence**, not independently verified by GraphEdIn. Exports preserve this distinction. The fictional example is never substituted for a failed live search.

## Run locally

Requires Node.js 22 or newer. No package installation is needed.

```sh
cp .env.example .env
# Edit .env and set BRAVE_SEARCH_API_KEY from your Brave Search account.
node --env-file=.env server/index.js
```

Open http://localhost:3000. Without a key, graph editing, imports, exports and the fictional example work; live discovery returns an explicit configuration error.

```sh
npm run check
npm test
npm run build
```

`dist/` contains only the public frontend. `server/`, `.env`, and API keys are never copied into it. All asset paths are relative so `/graphedin/` works on Pages.

## Deploy

See [docs/SETUP_AND_TEST.md](docs/SETUP_AND_TEST.md) for complete GitHub Pages and backend setup. Pages cannot execute the search backend. After deploying the API, set its HTTPS origin in the app's **Connection settings**, or set `apiBaseUrl` in `config.json` for all visitors.

Production status must be checked in GitHub Actions; a committed workflow alone does not prove that Pages is live. A private repository requires a GitHub plan that supports Pages for private repositories. Enabling Pages is an administrative setting, separate from source write access.

## Data format

```json
{
  "schemaVersion": 1,
  "company": "Your company",
  "mode": "research",
  "people": [
    {"id": "ceo", "name": "Person One", "role": "CEO", "department": "Leadership"},
    {
      "id": "engineer", "name": "Person Two", "role": "Engineering Manager",
      "department": "Engineering", "linkedin": "https://www.linkedin.com/in/profile-slug",
      "managerId": "ceo", "relationship": "inferred", "evidence": "Title-based guess; review required."
    }
  ]
}
```

Names above demonstrate the schema, not real people. `managerId` is optional. `relationship` is `inferred` or `confirmed`; `confirmed` requires an `evidence` note when a manager is specified. Import accepts at most 500 people and a 2 MB file. HTML in names or excerpts is rendered as text. LinkedIn URLs must be HTTPS profile URLs, and tracking query parameters are removed.

## Architecture and maintenance

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [AGENTS.md](AGENTS.md), and [DESIGN.md](DESIGN.md). No runtime frontend libraries or build dependency chain. Native browser APIs and Node's built-in test runner are used.
