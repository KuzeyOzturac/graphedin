import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {discover, companyName} from './discovery.js';
const root = fileURLToPath(new URL('../', import.meta.url));
const origins = new Set((process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000').split(',').map(s=>s.trim()));
const requests = new Map(); const cache = new Map();
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml'};
function json(res, status, body) {res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));}
export const server = http.createServer(async (req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  const origin = req.headers.origin;
  if(origin && !origins.has(origin)) return json(res,403,{error:'Origin is not allowed.'});
  if(origin) {res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
  if(req.method === 'OPTIONS') {res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');res.writeHead(204);return res.end();}
  if(req.method !== 'GET') return json(res,405,{error:'Method not allowed.'});
  const url = new URL(req.url,'http://localhost');
  if(url.pathname === '/api/health') return json(res,200,{configured:Boolean(process.env.BRAVE_SEARCH_API_KEY || process.env.SEARXNG_URL)});
  if(url.pathname === '/api/discover') {
    try {
      const company = companyName(url.searchParams.get('company'));
      // Do not trust forwarding headers unless your hosting platform explicitly sanitizes them.
      const ip = req.socket.remoteAddress || 'unknown';const window = Math.floor(Date.now()/60000);const hit = requests.get(ip);
      const count = hit?.window === window ? hit.count + 1 : 1;requests.set(ip,{window,count});
      if(requests.size > 10000) requests.clear();
      if(count > 10) {res.setHeader('Retry-After','60');return json(res,429,{error:'Too many searches. Wait one minute.'});}
      const cached = cache.get(company.toLowerCase());
      if(cached && cached.expires > Date.now()) return json(res,200,cached.graph);
      const graph = await discover(company,process.env.BRAVE_SEARCH_API_KEY,fetch,process.env.SEARXNG_URL);
      if(cache.size >= 100) cache.delete(cache.keys().next().value);
      cache.set(company.toLowerCase(),{graph,expires:Date.now()+900000});return json(res,200,graph);
    } catch(e) {return json(res,e.status || (e.name === 'TimeoutError' ? 504 : 400),{error:e.name === 'TimeoutError' ? 'Search timed out. Try again.' : e.message});}
  }
  try {
    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    if(!['/index.html','/config.json','/favicon.svg'].includes(pathname) && !/^\/src\/[a-z-]+\.(js|css)$/.test(pathname)) return json(res,404,{error:'Not found.'});
    const body = await readFile(path.join(root,pathname));res.writeHead(200,{'Content-Type':types[path.extname(pathname)] || 'text/plain'});res.end(body);
  }catch{return json(res,404,{error:'Not found.'});}
});
if(process.argv[1] === fileURLToPath(import.meta.url)) server.listen(Number(process.env.PORT || 3000),'0.0.0.0',()=>console.log('GraphEdIn listening on port '+(process.env.PORT || 3000)));
