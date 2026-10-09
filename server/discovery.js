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
  if (!key && !searxngUrl) throw Object.assign(new Error('Automatic discovery is not configured by the site owner.'), {status:503});
  const query = `site:linkedin.com/in/ "${company}"`;
  const queries=[query,`${query} (CEO OR president OR director OR head)`,`${query} (manager OR lead OR engineer)`];
  const search=async q=>{
    const url = searxngUrl ? new URL('search', searxngUrl.replace(/\/$/, '') + '/') : new URL('https://api.search.brave.com/res/v1/web/search');
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw Object.assign(new Error('Invalid server search configuration.'), {status:503});
    url.search = new URLSearchParams(searxngUrl ? {q,format:'json',categories:'general'} : {q,count:'20',extra_snippets:'true'}).toString();
    const headers = {Accept:'application/json'};
    if (!searxngUrl) headers['X-Subscription-Token'] = key;
    const response = await fetchImpl(url, {headers,signal:AbortSignal.timeout(15000)});
    if (!response.ok) throw Object.assign(new Error(response.status === 429 ? 'Search provider rate limit reached. Try again later.' : 'The search provider could not complete the request.'), {status:response.status === 429 ? 429 : 502});
    let data;
    try { data = await response.json(); } catch { throw Object.assign(new Error('The search provider returned an invalid response.'), {status:502}); }
    if(searxngUrl&&!Array.isArray(data.results)||!searxngUrl&&!Array.isArray(data.web?.results)) throw Object.assign(new Error('Search returned an unsupported response.'), {status:502});
    return searxngUrl ? data.results.slice(0,50).map(r=>({...r,description:r.content})) : data.web.results.slice(0,20);
  };
  const responses=await Promise.allSettled(queries.map(search));
  const successful=responses.filter(r=>r.status==='fulfilled');
  if(!successful.length)throw responses.find(r=>r.status==='rejected').reason;
  // Keep only candidates whose public observation mentions the queried company.
  const normalize=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const employer=normalize(company);
  const results=successful.flatMap(r=>r.value).filter(r=>(' '+normalize(`${r.title} ${r.description}`)+' ').includes(' '+employer+' '));
  const graph=parseResults(results,company);
  const warnings=responses.flatMap((r,i)=>r.status==='rejected'?[`Search ${i+1} was unavailable. Coverage is partial.`]:[]);
  return {...graph,query,queries,warnings,coverage:`Public LinkedIn profile candidates from ${successful.length} searches. Employment and titles may be outdated. Reporting lines are inferred, not verified.`};
}
