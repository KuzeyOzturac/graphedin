import {validateGraph, demo, layout, suggestManagers, safeLinkedIn, department} from './model.js';
const $ = id => document.getElementById(id);
const STORE = 'graphedin.graph.v1'; const CONNECTION = 'graphedin.api.v1';
let data = {schemaVersion:1,company:'Company graph',people:[]}, selected = '', displayPeople = [], apiBase = '', busy = false;
let view = {x:0,y:0,w:960,h:600}, natural = {width:960,height:600};
function message(value, error=false){$('status').textContent=value;$('status').classList.toggle('error',error);}
function save(){try{localStorage.setItem(STORE,JSON.stringify(data));}catch{message('Browser storage is unavailable. Export JSON to save your work.',true);}}
function el(tag, content, cls){const e=document.createElement(tag);if(content!==undefined)e.textContent=content;if(cls)e.className=cls;return e;}
function initials(p){return p.name.split(/\s+/).map(s=>s[0]).slice(0,2).join('').toUpperCase();}
function applyView(){ $('graph').setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`);$('zoom-level').textContent=Math.round(natural.width/view.w*100)+'%'; }
function fit(){const box=$('canvas').getBoundingClientRect();const ratio=(box.width||960)/(box.height||600);let w=natural.width+40,h=natural.height+40;if(w/h>ratio)h=w/ratio;else w=h*ratio;view={x:(natural.width-w)/2,y:(natural.height-h)/2,w,h};applyView();}
function zoom(factor,point){const nextW=Math.max(140,Math.min(25000,view.w*factor));const ratio=nextW/view.w;const px=point?.x ?? .5,py=point?.y ?? .5;view={x:view.x+view.w*px*(1-ratio),y:view.y+view.h*py*(1-ratio),w:nextW,h:view.h*ratio};applyView();}
function svgEl(tag,attrs={},text){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;return e;}
function clip(s,n){return s.length>n?s.slice(0,n-1)+'…':s;}
function render(reset=false){
  const filter=$('person-search').value.toLowerCase(),dep=$('department').value;
  const all=$('suggest').checked?suggestManagers(data.people):data.people;
  displayPeople=all.filter(p=>(!dep||p.department===dep)&&`${p.name} ${p.role}`.toLowerCase().includes(filter));
  $('count').textContent=`${displayPeople.length}`;$('graph-title').textContent=data.company;
  $('graph-kind').textContent=data.mode==='demo'?'FICTIONAL EXAMPLE':'LINKEDIN RESEARCH WORKSPACE';
  const departments=[...new Set(data.people.map(p=>p.department))].sort();
  $('department').replaceChildren(new Option('All departments',''),...departments.map(d=>new Option(d,d)));$('department').value=dep;
  const list=$('people-list');list.replaceChildren();
  for(const p of displayPeople){const button=el('button',undefined,'person-row'+(p.id===selected?' active':''));const avatar=el('span',initials(p),'initials');const copy=el('span');copy.append(el('strong',p.name),el('small',p.role));button.append(avatar,copy);button.onclick=()=>select(p.id);list.append(button);}
  if(!displayPeople.length && data.people.length)list.append(el('p','No people match these filters.','source-excerpt'));
  const graph=$('graph');graph.replaceChildren();$('empty').hidden=displayPeople.length>0||busy;graph.hidden=!displayPeople.length||busy;
  if(!displayPeople.length&&data.people.length){$('empty').querySelector('h3').textContent='No matching people';$('empty').querySelector('p').textContent='Clear the person or department filters to see the graph.';}else{$('empty').querySelector('h3').textContent='A company starts with its people.';$('empty').querySelector('p').textContent='Generate a graph to begin, or load the example to explore the controls.';}
  natural=layout(displayPeople);const {positions}=natural;
  const ids=new Set(displayPeople.map(p=>p.id));let edges=0;
  for(const p of displayPeople){if(!ids.has(p.managerId))continue;edges++;const from=positions.get(p.managerId),to=positions.get(p.id),x1=from.x+122,y1=from.y+108,x2=to.x+122,y2=to.y;graph.append(svgEl('path',{d:`M${x1},${y1} C${x1},${y1+40} ${x2},${y2-40} ${x2},${y2}`,fill:'none',stroke:p.relationship==='confirmed'?'#256d5a':'#7d8d81','stroke-width':1.7,'stroke-dasharray':p.relationship==='confirmed'?'':'6 5'}));}
  $('relationship-count').textContent=`${edges} relationship${edges===1?'':'s'}`;
  for(const p of displayPeople){const {x,y}=positions.get(p.id);const g=svgEl('g',{transform:`translate(${x},${y})`,class:'graph-node',tabindex:0,role:'button','aria-label':`${p.name}, ${p.role}. Open profile.`});
    g.append(svgEl('rect',{width:244,height:108,rx:9,fill:'#fcfdfa',stroke:p.id===selected?'#256d5a':'#cbd8cd','stroke-width':p.id===selected?2:1}),svgEl('rect',{x:15,y:17,width:34,height:34,rx:10,fill:'#e5eee7'}),svgEl('text',{x:32,y:39,'text-anchor':'middle',fill:'#256d5a','font-size':12,'font-family':'Outfit, sans-serif'},initials(p)),svgEl('text',{x:60,y:30,fill:'#21332d','font-size':13,'font-weight':500,'font-family':'Outfit, sans-serif'},clip(p.name,24)),svgEl('text',{x:60,y:47,fill:'#5c6b64','font-size':10,'font-family':'Outfit, sans-serif'},clip(p.role,30)),svgEl('line',{x1:15,y1:64,x2:229,y2:64,stroke:'#dbe2da'}),svgEl('text',{x:15,y:87,fill:'#256d5a','font-size':10,'font-family':'Outfit, sans-serif'},p.department),svgEl('text',{x:228,y:87,'text-anchor':'end',fill:'#5c6b64','font-size':9,'font-family':'Outfit, sans-serif'},data.mode==='demo'?'Example':p.linkedin?'LinkedIn source':'User supplied'));
    g.onclick=()=>select(p.id);g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(p.id);}};graph.append(g);}
  if(reset)fit();else applyView();renderDetail();
  $('export-json').disabled=!data.people.length;$('export-svg').disabled=!displayPeople.length;
}
function select(id){selected=id;render();}
function renderDetail(){const detail=$('detail');detail.replaceChildren(el('p','PROFILE INSPECTOR','eyebrow'));const p=displayPeople.find(p=>p.id===selected);if(!p){detail.append(el('h3','Select a person'),el('p','Review their role, LinkedIn source, and reporting relationships here.'));return;}
  detail.append(el('div',initials(p),'initials'),el('h3',p.name),el('p',p.role),el('span',p.department,'badge'));
  const dl=el('dl');const manager=displayPeople.find(q=>q.id===p.managerId)||data.people.find(q=>q.id===p.managerId);
  for(const[label,value]of [['Reports to',manager?.name||'Unknown'],['Relationship',manager?(p.relationship==='confirmed'?'User-confirmed':'Inferred / unverified'):'Not established'],['Observed',p.observedAt?new Date(p.observedAt).toLocaleDateString():'Not available']])dl.append(el('dt',label),el('dd',value));detail.append(dl);
  if(p.linkedin){const a=el('a','Open LinkedIn profile ↗');a.href=p.linkedin;a.target='_blank';a.rel='noopener noreferrer';detail.append(a);}
  if(p.excerpt){detail.append(el('h3','Search excerpt'),el('p',p.excerpt,'source-excerpt'));}
  if(p.evidence)detail.append(el('p',p.evidence,'source-excerpt'));
  detail.append(el('p',data.mode==='demo'?'Fictional person and reporting relationships.':'Search-index observations are not proof of current employment. Confirm roles and reporting lines against the source.'));
  const edit=el('button','Edit person');edit.onclick=()=>openEditor(data.people.find(q=>q.id===p.id));const remove=el('button','Remove person');remove.onclick=()=>{data=validateGraph({...data,people:data.people.filter(q=>q.id!==p.id).map(q=>q.managerId===p.id?{...q,managerId:'',evidence:''}:q)});selected='';save();render(true);message('Person removed. Related reporting lines were cleared.');};detail.append(edit,remove);
}
function loadDemo(){data=structuredClone(demo);selected='';$('person-search').value='';$('department').value='';save();render(true);message('Fictional example loaded. These people and reporting lines are not LinkedIn data.');}
$('load-demo').onclick=loadDemo;$('empty-demo').onclick=loadDemo;
$('person-search').oninput=()=>render(true);$('department').onchange=()=>render(true);$('suggest').onchange=()=>{render(true);message($('suggest').checked?'Dashed lines are title-based suggestions, not verified reporting relationships.':'Only stored reporting relationships are shown.');};
$('zoom-in').onclick=()=>zoom(.8);$('zoom-out').onclick=()=>zoom(1.25);$('fit').onclick=fit;
const canvas=$('canvas');let drag=null;
canvas.addEventListener('pointerdown',e=>{if(e.target.closest('button,.graph-node'))return;drag={x:e.clientX,y:e.clientY,view:{...view}};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const r=canvas.getBoundingClientRect();view.x=drag.view.x-(e.clientX-drag.x)*view.w/r.width;view.y=drag.view.y-(e.clientY-drag.y)*view.h/r.height;applyView();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>drag=null);
canvas.addEventListener('wheel',e=>{if(!data.people.length)return;e.preventDefault();const r=canvas.getBoundingClientRect();zoom(e.deltaY>0?1.12:.89,{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height});},{passive:false});
canvas.addEventListener('keydown',e=>{if(e.target!==canvas)return;const moves={ArrowLeft:[-.08,0],ArrowRight:[.08,0],ArrowUp:[0,-.08],ArrowDown:[0,.08]};if(moves[e.key]){e.preventDefault();view.x+=moves[e.key][0]*view.w;view.y+=moves[e.key][1]*view.h;applyView();}else if(['+','=','-','0'].includes(e.key)){e.preventDefault();e.key==='0'?fit():zoom(e.key==='-'?1.25:.8);}});
new ResizeObserver(()=>{if(data.people.length)fit();}).observe(canvas);
function download(name,body,type){const url=URL.createObjectURL(new Blob([body],{type}));const a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function filename(){return data.company.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,60)||'company';}
$('export-json').onclick=()=>download(filename()+'.json',JSON.stringify(data,null,2),'application/json');
$('export-svg').onclick=()=>{const svg=$('graph').cloneNode(true);svg.setAttribute('viewBox',`0 0 ${natural.width} ${natural.height+45}`);svg.setAttribute('width',natural.width);svg.setAttribute('height',natural.height+45);svg.removeAttribute('hidden');svg.removeAttribute('id');svg.insertBefore(svgEl('rect',{width:'100%',height:'100%',fill:'#f0f4ef'}),svg.firstChild);svg.append(svgEl('text',{x:20,y:natural.height+25,'font-family':'sans-serif','font-size':12,fill:'#21332d'},`${data.company} · ${data.mode==='demo'?'Fictional example':'LinkedIn search observations'} · Dashed = inferred; solid = user-confirmed`));download(filename()+'.svg',new XMLSerializer().serializeToString(svg),'image/svg+xml');};
$('import-file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>2000000)throw new Error('Import is limited to 2 MB.');const next=validateGraph(JSON.parse(await file.text()));data=next;selected='';$('department').value='';$('person-search').value='';save();render(true);message(`Imported ${data.people.length} people.`);}catch(e){message(e.message,true);}finally{$('import-file').value='';}};
$('clear').onclick=()=>{data={schemaVersion:1,company:'Company graph',people:[]};selected='';save();render(true);message('Workspace cleared. Imported or discovered data can be loaded again.');};
$('settings').onclick=()=>{$('api-url').value=apiBase;$('settings-dialog').showModal();};
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$(b.dataset.close).close();
$('settings-form').onsubmit=e=>{e.preventDefault();const value=$('api-url').value.trim();try{if(value){const u=new URL(value);if(u.username||u.password||u.search||u.hash||!(u.protocol==='https:'||(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname))))throw new Error('Use an HTTPS backend URL, or localhost for development.');apiBase=u.href.replace(/\/$/,'');}else apiBase='';try{localStorage.setItem(CONNECTION,apiBase);}catch{}$('settings-dialog').close();message('Connection saved. You can now generate a graph.');}catch(e){message(e.message,true);}};
function openEditor(p){$('person-form').reset();$('edit-error').textContent='';$('edit-id').value=p?.id||'';$('person-dialog-title').textContent=p?'Edit person':'Add person';for(const[key,id]of [['name','person-name'],['role','person-role'],['department','person-dept'],['linkedin','person-linkedin'],['evidence','evidence']])$(id).value=p?.[key]||'';$('manager').replaceChildren(new Option('Unknown / no reporting line',''),...data.people.filter(q=>q.id!==p?.id).map(q=>new Option(q.name,q.id)));$('manager').value=p?.managerId||'';$('relationship').value=p?.relationship||'inferred';$('person-dialog').showModal();}
$('add-person').onclick=()=>openEditor();
$('person-form').onsubmit=e=>{e.preventDefault();try{const id=$('edit-id').value||crypto.randomUUID(),previous=data.people.find(p=>p.id===id);const linkedin=$('person-linkedin').value.trim();if(linkedin&&!safeLinkedIn(linkedin))throw new Error('Use an HTTPS LinkedIn /in/ profile URL.');const role=$('person-role').value.trim();const p={...previous,id,name:$('person-name').value,role,department:$('person-dept').value||department(role),linkedin,managerId:$('manager').value,relationship:$('relationship').value,evidence:$('evidence').value};const people=previous?data.people.map(q=>q.id===id?p:q):[...data.people,p];data=validateGraph({...data,people});selected=id;save();render(true);$('person-dialog').close();message('Person saved.');}catch(e){$('edit-error').textContent=e.message;}};
$('company-form').onsubmit=async e=>{
  e.preventDefault();if(busy)return;const company=$('company').value.trim();if(!apiBase&&location.hostname.endsWith('github.io')){message('Live discovery needs a backend connection. Open Connection settings, or use Import JSON while configuring the backend.',true);$('settings').click();return;}
  busy=true;$('generate').disabled=true;$('loading').hidden=false;render();message(`Searching publicly indexed LinkedIn profiles for ${company}…`);
  try{const base=apiBase||location.origin;const url=new URL(`${base}/api/discover`);url.searchParams.set('company',company);const response=await fetch(url,{signal:AbortSignal.timeout(25000),credentials:'omit'});let result;try{result=await response.json();}catch{throw new Error('The backend did not return JSON. Check Connection settings.');}if(!response.ok)throw new Error(result.error||'Search failed.');const next=validateGraph(result);data=next;selected='';$('person-search').value='';$('department').value='';save();message(data.people.length?`Found ${data.people.length} LinkedIn profile candidates. Verify current employment. Reporting lines are unknown until reviewed.`:'No indexed profiles found. Try the full company name or import profile data.');}catch(e){message(e.name==='TimeoutError'?'Search timed out. Try again.':e.message,true);}finally{busy=false;$('generate').disabled=false;$('loading').hidden=true;render(true);}
};
async function init(){try{const saved=localStorage.getItem(STORE);if(saved)data=validateGraph(JSON.parse(saved));apiBase=localStorage.getItem(CONNECTION)||'';}catch{message('Saved data could not be restored. Import a previously exported JSON file.',true);}
  try{const config=await(await fetch('./config.json')).json();if(!apiBase&&config.apiBaseUrl)apiBase=config.apiBaseUrl;}catch{}
  render(true);if(data.people.length)message(data.mode==='demo'?'Restored fictional example.':'Restored your previous workspace from this browser.');}
init();
