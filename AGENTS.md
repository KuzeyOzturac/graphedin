# Contributor instructions

Read README.md and docs/ARCHITECTURE.md before changing data acquisition. Read DESIGN.md before UI edits.

- Preserve the frontend/backend boundary: Pages is static; secrets live only in the backend environment.
- Do not introduce LinkedIn session-cookie handling or claim access to private employee/reporting data.
- Preserve source URLs, excerpts and timestamps. Distinguish candidate profiles, inferred reporting, and user-confirmed reporting.
- Never present sample people as discovered results. Keep fictional demo labeling on screen and in SVG exports.
- Validate graph mutations and imports, including IDs, manager existence, cycles, size limits, and safe URLs.
- Render user/provider content with textContent or equivalent escaping, never raw HTML.
- Keep all frontend asset paths relative for the `/graphedin/` Pages base path.
- Prefer built-in browser and Node APIs; justify new runtime dependencies.
- Run `npm run check`, `npm test`, and `npm run build` after relevant edits.
- Update docs/SETUP_AND_TEST.md for each release that changes installation or test behavior.
- Report actual deployment outcomes; a pushed workflow is not a successful deployment.
- Do not change repository visibility without explicit authorization.
