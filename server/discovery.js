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
export async function discover(company, key, fetchImpl = fetch) {
  company = companyName(company);
  if (!key) throw Object.assign(new Error('Search is not configured. Set BRAVE_SEARCH_API_KEY on the backend.'), {status:503});
  const query = `site:linkedin.com/in/ "${company}"`;
  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.search = new URLSearchParams({q:query,count:'20',extra_snippets:'true'}).toString();
  const response = await fetchImpl(url, {headers:{Accept:'application/json','X-Subscription-Token':key},signal:AbortSignal.timeout(15000)});
  if (!response.ok) throw Object.assign(new Error(response.status === 429 ? 'Search provider rate limit reached. Try again later.' : 'The search provider could not complete the request. Check the backend configuration.'), {status:response.status === 429 ? 429 : 502});
  const data = await response.json();
  const graph = parseResults(data.web?.results || [], company);
  return {...graph, query, coverage:'Up to 20 publicly indexed LinkedIn profile results. Snippets may describe previous roles. Verify current employment and titles. No reporting lines are verified by this search.'};
}
