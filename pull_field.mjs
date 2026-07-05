import https from 'https'; import fs from 'fs';
const TOKEN=fs.readFileSync('C:/Users/Adam/wetlether/capture/.hf_token','utf8').trim();
const REPO='SALT-NLP/SWE-chat';
function get(u,j,a){return new Promise((res,rej)=>{https.get(u,{headers:{'User-Agent':'wl',...(a?{Authorization:'Bearer '+TOKEN}:{})}},r=>{if(r.statusCode>=300&&r.statusCode<400&&r.headers.location)return get(r.headers.location,j,false).then(res,rej);if(r.statusCode!==200){let b='';r.on('data',d=>b+=d);r.on('end',()=>rej(new Error(r.statusCode)));return;}let b='';r.on('data',d=>b+=d);r.on('end',()=>{try{res(j?JSON.parse(b):b)}catch(e){rej(e)}});}).on('error',rej);});}
function parse(raw){const t=[];for(const ln of raw.split('\n')){if(!ln)continue;let o;try{o=JSON.parse(ln)}catch{continue}let role=null,text=null;if(o.type==='response_item'&&o.payload?.type==='message'){role=o.payload.role;const c=o.payload.content;text=Array.isArray(c)?c.map(b=>b.text||'').join(' ').trim():(typeof c==='string'?c:'');}else if(o.message?.role){role=o.message.role;const c=o.message.content;if(typeof c==='string')text=c;else if(Array.isArray(c)){if(c.some(b=>b?.type==='tool_result'))continue;text=c.filter(b=>b?.type==='text').map(b=>b.text).join(' ').trim();}}if(role&&text)t.push({role,text});}return t;}
const clean=t=>t.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const PATH=/^\/?(Users|home)\//i, DRIVE=/^[A-Za-z]:\\/, TERM=/\bzsh\b|\bbash\b|America\/|Europe\/|Asia\//i;
const NOISE=/base directory|system-reminder|caveat:|messages below were generated|request interrupted|implement the following plan|# specification|generated from|AGENTS\.md/i;
const VERB=/\b(fix|change|add|remove|bug|error|update|make|check|why|should|instead|need|use|move|rename|review|test|refactor|implement|can you|let's|i want|i think|please|don't|not)\b/i;
function ok(s){ if(s.length<35||s.length>280)return false; if(PATH.test(s)||DRIVE.test(s)||TERM.test(s))return false; if(NOISE.test(s))return false; if(!/[a-z]/.test(s)||s.split(' ').length<6)return false; return VERB.test(s); }
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const tree=await get(`https://huggingface.co/api/datasets/${REPO}/tree/main?recursive=true`,true,true);
let tx=shuf(tree.filter(f=>f.type==='file'&&/\.jsonl$/.test(f.path)&&/transcript/i.test(f.path)&&f.size>25000&&f.size<700000));
const turns=[]; const seen=new Set();
for(const f of tx.slice(0,36)){let raw;try{raw=await get(`https://huggingface.co/datasets/${REPO}/resolve/main/${f.path}`,false,true);}catch{continue;}
  for(const t of parse(raw)){if(t.role!=='user')continue;const s=clean(t.text);if(!ok(s))continue;const k=s.slice(0,45).toLowerCase();if(seen.has(k))continue;seen.add(k);turns.push(s);}
  if(turns.length>130)break;}
const batch=shuf(turns).slice(0,48);
fs.writeFileSync('C:/Users/Adam/whetstone/field_batch.json',JSON.stringify(batch,null,1));
console.log('pulled '+batch.length+' clean field turns:\n');
batch.forEach((t,i)=>console.log((i+1)+'. '+t.slice(0,140)));
