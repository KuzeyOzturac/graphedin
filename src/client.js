// Deployment-owned connection. Visitors only supply a company name.
export function backendUrl(value, hostname, origin) {
  if (!value) return ['localhost','127.0.0.1'].includes(hostname) ? origin : '';
  const url=new URL(value);
  if(url.username||url.password||url.search||url.hash||!(url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)))) throw new Error('Invalid deployment connection.');
  return url.href.replace(/\/$/,'');
}
export async function discoverCompany(company, base, fetchImpl=fetch) {
  if (!base) throw new Error('Automatic discovery is not available yet. The site owner needs to connect the search service.');
  const url=new URL(`${base}/api/discover`);url.searchParams.set('company',company);
  const response=await fetchImpl(url,{signal:AbortSignal.timeout(25000),credentials:'omit',cache:'no-store'});
  let result;
  try{result=await response.json();}catch{throw new Error('Discovery returned an invalid response. Try again later.');}
  if(!response.ok)throw new Error(result.error||'Discovery is temporarily unavailable. Try again later.');
  return result;
}
