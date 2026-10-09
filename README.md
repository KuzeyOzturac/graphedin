# GraphEdIn

Enter a company name to discover public LinkedIn profile candidates and generate a people graph automatically. Visitors do not search, paste results, enter keys or configure a backend.

## Implementation and deployment status

The company-name-only frontend and automatic search backend are implemented. The GitHub Pages frontend is deployed separately from the discovery API. **Live automatic discovery is blocked until the owner provisions a search backend and sets `apiBaseUrl` in `config.json`.** The current empty configuration reports that dependency honestly; it does not open manual research or substitute fictional people.

The backend supports Brave Search (an owner-held key) or an owner-hosted SearXNG endpoint (no search API key). Three bounded searches cover general profiles, leadership and other roles; results are filtered by company mention, deduplicated by LinkedIn URL and retain excerpts and timestamps. Partial provider failures are disclosed.

## Graph behavior

- People are placed by title seniority. Dashed reporting suggestions appear automatically when a unique plausible manager exists; they are inferred, not verified.
- Ambiguous reporting relationships remain unconnected. No complete employee census or current-employment guarantee is claimed.
- Profile inspection, optional editing, filters, pan/zoom, JSON import/export and SVG export remain available.
- A separate fictional example is always labeled. Failed discovery never loads it.
- Data stays in browser storage. Provider credentials stay on the server.

## Owner setup

Node.js 22 or newer; no package installation is required.

```sh
cp .env.example .env
# Set SEARXNG_URL or BRAVE_SEARCH_API_KEY in the server environment.
node --env-file=.env server/index.js
```

Localhost automatically uses its local server. For production, deploy `server/index.js` to a Node host or `server/worker.js` to Cloudflare, set the allowed origin to `https://kuzeyozturac.github.io`, and set the API's HTTPS origin in `config.json`. These are owner deployment steps, never visitor steps. GitHub Pages serves static files and cannot run the discovery API.

```sh
npm run check
npm test
npm run build
```

See [docs/SETUP_AND_TEST.md](docs/SETUP_AND_TEST.md) for deployment and verification. Public search observations may be incomplete or outdated, and title-based lines do not prove reporting relationships. LinkedIn sign-in, cookies and authenticated scraping are not used.

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
