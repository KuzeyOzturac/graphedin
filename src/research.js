import {text, safeLinkedIn, department, validateGraph, MAX_PEOPLE} from './model.js';
const URL_RE = /https:\/\/(?:(?:www|[a-z]{2,3})\.)?linkedin\.com\/in\/[^\s<>"')]+/gi;
function decode(value) {
  return value.replace(/&#(x[0-9a-f]+|\d+);/gi, (_,n)=>{const code=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return code>0&&code<=0x10ffff?String.fromCodePoint(code):'';})
    .replace(/&(amp|quot|apos|lt|gt|nbsp);/gi,(_,s)=>({amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '})[s.toLowerCase()]);
}
function plain(html) {return decode(html.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();}
function profileURL(value) {
  let raw=decode(value).replace(/[.,;]+$/,'');
  try {const u=new URL(raw,'https://www.google.com');if(/(^|\.)google\.[a-z.]+$/.test(u.hostname)&&u.pathname==='/url')raw=u.searchParams.get('q')||u.searchParams.get('url')||raw;}catch{}
  return safeLinkedIn(raw);
}
function identity(raw) {
  const title=text(raw,600).replace(/\s*[|–—-]\s*LinkedIn\s*$/i,'').replace(/\s*\|\s*\d+\s*connections.*$/i,'');
  const parts=title.split(/\s+(?:-|–|—|\|)\s+/);const name=text(parts.shift());
  if(!name||name.length<3||!/[\p{L}]/u.test(name)||/https?:|linkedin|profiles|sign in|search|see more|people also|followers|connections|^experience$|^about$|^education$/i.test(name))return null;
  return {name,role:text(parts.join(' · '))||'Role not confirmed'};
}
export function searchLinks(company,scope='all') {
  company=text(company,120).replace(/["\\\x00-\x1f]/g,'');
  const qualifiers={all:'',leadership:'(CEO OR chief OR president OR founder)',directors:'(director OR "head of" OR "vice president")',managers:'(manager OR lead)'};
  const query=`site:linkedin.com/in/ "${company}" ${qualifiers[scope]||''}`.trim();
  return {query,google:`https://www.google.com/search?${new URLSearchParams({q:query})}`,bing:`https://www.bing.com/search?${new URLSearchParams({q:query})}`,linkedin:`https://www.linkedin.com/search/results/people/?${new URLSearchParams({keywords:company})}`};
}
export function parseResearch({company,content='',html='',now=new Date().toISOString()}) {
  if(!text(company,120)||text(company,120).length<2)throw new Error('Enter the company name before parsing results.');
  if(content.length+html.length>2000000)throw new Error('Pasted research is limited to 2 MB.');
  const people=[],seen=new Set();let ignored=0;
  function add(raw,linkedin,excerpt='',roleOverride='',deptOverride='') {
    const who=identity(raw);linkedin=profileURL(linkedin);if(!who||!linkedin){ignored++;return;}
    if(seen.has(linkedin))return;seen.add(linkedin);
    const role=text(roleOverride)||who.role;
    people.push({id:`research-${people.length+1}`,name:who.name,role,department:text(deptOverride,80)||department(role),linkedin,excerpt:text(excerpt,2000),observedAt:now,managerId:'',relationship:'inferred',evidence:''});
  }
  // Rich clipboard anchors preserve profile URLs that aren't present in visible text.
  const anchors=[...html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi)];
  for(const a of anchors){const url=profileURL(a[2]);if(!url)continue;const titleMatch=a[3].match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i);const label=plain(titleMatch?titleMatch[1]:a[3]);if(label.length>250||/^(?:https?:|www\.|linkedin\.)/i.test(label))continue;add(label,url,'User-pasted search result. Review the LinkedIn profile to confirm employer and role.');}
  const lines=content.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  for(let i=0;i<lines.length;i++){
    const line=lines[i];const columns=line.split('\t');const urls=[...line.matchAll(URL_RE)].map(m=>m[0]);
    if(!urls.length)continue;
    for(const url of urls){
      if(columns.length>=3){const index=columns.findIndex(c=>c.includes(url));if(index>=2){add(columns[0],url,columns.slice(index+1).join(' · '),columns[1],columns[3]||'');continue;}}
      const inline=line.replace(url,'').replace(/^[\s|–—-]+|[\s|–—-]+$/g,'').trim();
      let title=inline;
      if(!title){for(let n=i-1;n>=Math.max(0,i-4);n--){if(identity(lines[n])&&!/^(?:linkedin|www\.|https?:|\d+\s)/i.test(lines[n])){title=lines[n];break;}}}
      const excerpt=lines.slice(i+1,Math.min(lines.length,i+4)).filter(l=>!l.match(URL_RE)).join(' ');
      add(title,url,excerpt);
    }
  }
  const graph=validateGraph({company:text(company,120),mode:'research',fetchedAt:now,people});
  return {graph,ignored,warnings:[...(people.length?[]:['No named LinkedIn profiles were found. Copy results with names and full profile URLs, or paste tab-separated Name, Role, LinkedIn URL rows.']), 'Pasted results do not verify current employment or reporting relationships.']};
}
export function mergeResearch(current,incoming) {
  const same=current.company.toLocaleLowerCase()===incoming.company.toLocaleLowerCase()&&current.mode!=='demo';
  const people=same?current.people.map(p=>({...p})):[];let added=0,duplicate=0;
  const urls=new Set(people.map(p=>p.linkedin).filter(Boolean));
  for(const person of incoming.people){if(urls.has(person.linkedin)){duplicate++;continue;}urls.add(person.linkedin);people.push({...person,id:`research-${crypto.randomUUID()}`});added++;}
  if(people.length>MAX_PEOPLE)throw new Error(`The resulting chart exceeds ${MAX_PEOPLE} people. Import fewer results.`);
  return {graph:validateGraph({...incoming,people}),added,duplicate,replaced:!same&&current.people.length>0};
}
