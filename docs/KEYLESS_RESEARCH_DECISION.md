# Keyless discovery decision — 2026-10-09

## Goal
Source professional profile observations associated with a company from LinkedIn, without requiring the user to buy or configure a search API key. Publish the interface on GitHub Pages.

## Options considered

| Route | API key | Hosting | Finding |
| --- | --- | --- | --- |
| LinkedIn Profile API | OAuth and approved access | Server | Restricted access; not a generic company employee-directory endpoint. |
| Direct public LinkedIn scraping | None | Server | Public visibility varies; does not establish reporting lines. Not chosen as the default. |
| Bing search RSS | None | Server needed for browser access | Actual tests returned mostly irrelevant results; the site filter was not consistently respected. Response also includes reuse limitations. |
| DuckDuckGo HTML | None | Server needed for browser access | Actual request returned HTTP 202 with a challenge instead of result links. Not pursued through alternate routes. |
| Shared public SearXNG | Often none | External instance | Public instances often disable JSON; no stable dependency selected. |
| Self-hosted SearXNG | No search API key | Separate hosting | Technically supports JSON search; optional adapter implemented. Upstream search can still throttle it. |
| User-pasted public search results | None | Pages alone | Selected by the user. Preserves sources, permits review, and runs locally in the browser. |

## Stress test

**Does keyless mean automatic?** No. The selected default includes an explicit copy/paste step. Graph construction, preview parsing, deduplication and merging are automated after pasting.

**Can Pages fetch search HTML directly?** Not generally. The tested search responses had no browser CORS permission. A browser-only application must not rely on a public proxy or disabling browser security.

**Does a matching profile prove current employment?** No. Search titles and snippets can be stale, mention previous jobs, or refer to a company with a similar name. The user reviews candidates before importing.

**Does seniority establish a reporting line?** No. The graph preserves unknown managers and distinguishes optional title-based guesses with dashed lines.

**What if a result is just a URL?** The parser declines to invent a person's name or role. It reports no extracted people and explains the supported format.

**What if repeated research overwrites a corrected role?** Same-company merges deduplicate by LinkedIn URL and preserve existing edited people and reporting relationships.

**What if a paste contains hostile HTML?** It is treated as an extraction source only; HTML is never rendered. Names and snippets use text rendering, URLs are restricted to HTTPS LinkedIn profile links, and input size is bounded.

**What if automation is required later?** Configure the included backend with an owned SearXNG instance. No search API key is required, but server hosting and upstream reliability remain separate constraints.

## Sources

- LinkedIn public profile visibility: https://www.linkedin.com/help/linkedin/answer/a1340507
- LinkedIn Profile API: https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-api
- Browser CORS: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
- SearXNG Search API: https://docs.searxng.org/dev/search_api.html
- DuckDuckGo non-JavaScript search: https://safe.duckduckgo.com/duckduckgo-help-pages/features/non-javascript

Endpoint findings above are from actual HTTP tests during this implementation, not promises about permanent availability.
