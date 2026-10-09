// Optional Cloudflare Worker API. Bind RATE_LIMITER (simple rate limiting) before deploying.
import {discover, companyName} from './discovery.js';
export default {
  async fetch(request, env, ctx) {
    const origin=request.headers.get('Origin');const allowed=(env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
    const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
    if(origin&&!allowed.includes(origin))return reply(403,{error:'Origin is not allowed.'});
    if(origin)headers['Access-Control-Allow-Origin']=origin;
    if(request.method==='OPTIONS'){headers['Access-Control-Allow-Methods']='GET, OPTIONS';return new Response(null,{status:204,headers});}
    if(request.method!=='GET')return reply(405,{error:'Method not allowed.'});
    const url=new URL(request.url);
    if(url.pathname==='/api/health')return reply(200,{configured:Boolean(env.BRAVE_SEARCH_API_KEY || env.SEARXNG_URL)});
    if(url.pathname!=='/api/discover')return reply(404,{error:'Not found.'});
    try{
      const company=companyName(url.searchParams.get('company'));
      if(!env.RATE_LIMITER)return reply(503,{error:'Backend rate limiter is not configured.'});
      const limit=await env.RATE_LIMITER.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'});
      if(!limit.success){headers['Retry-After']='60';return reply(429,{error:'Too many searches. Wait one minute.'});}
      const cacheKey=new Request(`${url.origin}/cache/${encodeURIComponent(company.toLowerCase())}`);
      const cached=await caches.default.match(cacheKey);if(cached)return reply(200,await cached.json());
      const graph=await discover(company,env.BRAVE_SEARCH_API_KEY,fetch,env.SEARXNG_URL);
      ctx.waitUntil(caches.default.put(cacheKey,new Response(JSON.stringify(graph),{headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=900'}})));
      return reply(200,graph);
    }catch(e){return reply(e.status||(e.name==='TimeoutError'?504:400),{error:e.name==='TimeoutError'?'Search timed out. Try again.':e.message});}
  }
};
