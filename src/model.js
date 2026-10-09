export const MAX_PEOPLE = 500;
export function safeLinkedIn(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && (u.hostname === 'linkedin.com' || u.hostname.endsWith('.linkedin.com')) && /^\/in\/[^/]+\/?$/.test(u.pathname) ? `https://www.linkedin.com${u.pathname.replace(/\/$/, '')}` : ''; } catch { return ''; }
}
export function text(value, max = 200) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
export function tier(role) {
  const s = role.toLowerCase();
  if (/\b(ceo|chief executive|president|founder|chairman|chairwoman)\b/.test(s)) return 0;
  if (/\b(chief|cto|cfo|coo|cmo|cpo|cio|svp|evp|vice president|vp)\b/.test(s)) return 1;
  if (/\b(director|head of)\b/.test(s)) return 2;
  if (/\b(manager|lead)\b/.test(s)) return 3;
  return 4;
}
export function department(role) {
  const s = role.toLowerCase();
  for (const [name, re] of [['Engineering', /engineer|technical|technology|cto|developer|software|data|ai\b/], ['Finance', /financ|cfo|account|treasury/], ['People', /people|human resource|recruit|talent|\bhr\b/], ['Marketing', /market|cmo|brand|communications/], ['Sales', /sales|revenue|commercial|customer/], ['Product', /product|design|cpo/], ['Operations', /operation|coo|supply|logistic/]]) if (re.test(s)) return name;
  return tier(role) < 2 ? 'Leadership' : 'Unclassified';
}
export function validateGraph(input) {
  if (!input || !Array.isArray(input.people) || input.people.length > MAX_PEOPLE) throw new Error(`Import must contain a people array of at most ${MAX_PEOPLE} people.`);
  const ids = new Set();
  const people = input.people.map(p => {
    if (!p || !text(p.id, 100) || !text(p.name)) throw new Error('Every person needs an id and name.');
    const id = text(p.id, 100); if (ids.has(id)) throw new Error('Person IDs must be unique.'); ids.add(id);
    const role = text(p.role) || 'Role not confirmed';
    return {id, name: text(p.name), role, department: text(p.department, 80) || department(role), linkedin: safeLinkedIn(p.linkedin), excerpt: text(p.excerpt, 2000), managerId: text(p.managerId, 100), relationship: ['confirmed', 'inferred'].includes(p.relationship) ? p.relationship : 'inferred', evidence: text(p.evidence, 1000), observedAt: text(p.observedAt, 60)};
  });
  for (const p of people) {
    if (p.managerId && !ids.has(p.managerId)) throw new Error(`Unknown manager for ${p.name}.`);
    if (p.relationship === 'confirmed' && p.managerId && !p.evidence) throw new Error('Confirmed reporting lines require an evidence note.');
  }
  const map = new Map(people.map(p => [p.id, p]));
  for (const p of people) {
    const visited = new Set([p.id]); let next = p.managerId;
    while (next) { if (visited.has(next)) throw new Error('Reporting relationships cannot contain a cycle.'); visited.add(next); next = map.get(next).managerId; }
  }
  return {schemaVersion: 1, company: text(input.company) || 'Untitled company', mode: input.mode === 'demo' ? 'demo' : 'research', fetchedAt: text(input.fetchedAt, 60), people};
}
export function suggestManagers(people) {
  const result = people.map(p => ({...p}));
  const map = new Map(result.map(p => [p.id, p]));
  for (const p of result) {
    if (p.managerId) continue;
    const candidates = people.filter(q => q.id !== p.id && tier(q.role) < tier(p.role) && (q.department === p.department || tier(q.role) === 0));
    candidates.sort((a, b) => tier(b.role) - tier(a.role) || a.name.localeCompare(b.name));
    // Only suggest a link when there is a single candidate at the closest tier.
    if (!candidates.length || candidates.filter(q => tier(q.role) === tier(candidates[0].role)).length !== 1) continue;
    let cursor = candidates[0].id; const seen = new Set([p.id]); let cycle = false;
    while (cursor) { if (seen.has(cursor)) { cycle = true; break; } seen.add(cursor); cursor = map.get(cursor)?.managerId; }
    if (cycle) continue;
    p.managerId = candidates[0].id; p.relationship = 'inferred'; p.evidence = 'Title-based suggestion only. Reporting relationship is not verified.';
  }
  return result;
}
export function layout(people) {
  const map = new Map(people.map(p => [p.id, p])); const depths = new Map();
  function depth(p) { if (depths.has(p.id)) return depths.get(p.id); const d = p.managerId && map.has(p.managerId) ? depth(map.get(p.managerId)) + 1 : tier(p.role); depths.set(p.id, d); return d; }
  const rows = new Map(); for (const p of people) { const d = depth(p); if (!rows.has(d)) rows.set(d, []); rows.get(d).push(p); }
  const widest = Math.max(1, ...[...rows.values()].map(r => r.length)); const width = Math.max(960, widest * 276 + 100);
  const positions = new Map();
  for (const [d, row] of rows) { row.sort((a,b) => a.department.localeCompare(b.department) || a.name.localeCompare(b.name)); row.forEach((p,i) => positions.set(p.id, {x: (width - row.length * 276) / 2 + i * 276 + 14, y: 65 + d * 180})); }
  return {positions, width, height: Math.max(600, (Math.max(0, ...rows.keys()) + 1) * 180 + 70)};
}
export const demo = validateGraph({company:'Northstar Robotics', mode:'demo', people:[
  {id:'mira',name:'Mira Okonkwo',role:'CEO',department:'Leadership'},
  {id:'leon',name:'Leon Ferrer',role:'CTO',department:'Engineering',managerId:'mira',relationship:'confirmed',evidence:'Fictional example reporting line.'},
  {id:'yasmin',name:'Yasmin Demir',role:'Chief Operating Officer',department:'Operations',managerId:'mira',relationship:'confirmed',evidence:'Fictional example reporting line.'},
  {id:'tomas',name:'Tomás Ibarra',role:'VP of Product',department:'Product',managerId:'mira',relationship:'confirmed',evidence:'Fictional example reporting line.'},
  {id:'ada',name:'Ada Nwosu',role:'Director of Machine Learning',department:'Engineering',managerId:'leon',relationship:'confirmed',evidence:'Fictional example reporting line.'},
  {id:'selin',name:'Selin Arslan',role:'Head of Field Operations',department:'Operations',managerId:'yasmin',relationship:'inferred'},
  {id:'rene',name:'René Moreau',role:'Product Design Lead',department:'Product',managerId:'tomas',relationship:'confirmed',evidence:'Fictional example reporting line.'},
  {id:'niko',name:'Niko Petrović',role:'Senior ML Engineer',department:'Engineering',managerId:'ada',relationship:'confirmed',evidence:'Fictional example reporting line.'}
]});
