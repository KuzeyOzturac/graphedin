import {safeLinkedIn, text, department, validateGraph} from '../src/model.js';
export function companyName(value) {
  const name = text(value, 121);
  if (name.length < 2 || name.length > 120 || /[\x00-\x1f"\\]/.test(name)) throw new Error('Enter a company name between 2 and 120 characters, without quotes or control characters.');
  return name;
}
export function parseResults(results, company, now = new Date().toISOString()) {
  const seen = new Set(); const people = [];
  for (const result of results) {
    const linkedin = safeLinkedIn(result.url); if (!linkedin || seen.has(linkedin)) continue;
    const title = text(result.title, 500).replace(/\s*[|–-]\s*LinkedIn\s*$/i, '');
    const parts = title.split(/\s+(?:-|–|\|)\s+/); const name = parts.shift()?.trim();
    if (!name || name.length < 3 || !/\p{L}/u.test(name) || /linkedin|profiles|jobs|hiring/i.test(name)) continue;
    const excerpt = text(result.description, 2000).replace(/<[^>]*>/g, '');
    const roleCandidate = parts.join(' · ');
    const role = roleCandidate && roleCandidate.toLowerCase() !== company.toLowerCase() ? roleCandidate : 'Role not confirmed';
    seen.add(linkedin);
    people.push({id:`p${people.length+1}`,name,role,department:department(role),linkedin,excerpt,observedAt:now,managerId:''});
  }
  return validateGraph({company, fetchedAt:now, people});
}
export async function discover(company, key, fetchImpl = fetch, searxngUrl = '') {
  company = companyName(company);
  if (!key && !searxngUrl) throw Object.assign(new Error('Automatic search is not configured. Use keyless paste research, or configure SEARXNG_URL on the backend.'), {status:503});
  const query = `site:linkedin.com/in/ "${company}"`;
  const url = searxngUrl ? new URL('search', searxngUrl.replace(/\/$/, '') + '/') : new URL('https://api.search.brave.com/res/v1/web/search');
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw Object.assign(new Error('Invalid server search configuration.'), {status:503});
  url.search = new URLSearchParams(searxngUrl ? {q:query,format:'json',categories:'general'} : {q:query,count:'20',extra_snippets:'true'}).toString();
  const headers = {Accept:'application/json'};
  if (!searxngUrl) headers['X-Subscription-Token'] = key;
  const response = await fetchImpl(url, {headers,signal:AbortSignal.timeout(15000)});
  if (!response.ok) throw Object.assign(new Error(response.status === 429 ? 'Search provider rate limit reached. Try again later.' : 'The search provider could not complete the request. Check the backend configuration.'), {status:response.status === 429 ? 429 : 502});
  let data;
  try { data = await response.json(); } catch { throw Object.assign(new Error('Search returned a non-JSON response. The provider may be blocked or misconfigured; use keyless paste research.'), {status:502}); }
  if (searxngUrl && !Array.isArray(data.results)) throw Object.assign(new Error('Search returned an unsupported response.'), {status:502});
  const results = searxngUrl ? data.results.slice(0, 50).map(r => ({...r,description:r.content})) : (data.web?.results || []);
  const graph = parseResults(results, company);
  return {...graph, query, coverage:`Up to ${searxngUrl ? 50 : 20} publicly indexed profile candidates. Snippets may describe previous roles. Verify current employment and titles. Reporting lines are not verified.`};
}
