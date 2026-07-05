// Pull the LOWEST-scoring field turns with their text, so we can see whether a low score = real bad
// judgment (signal) or a turn with no judgment in it / grader misread (noise).
import fs from 'fs';
const CG='C:/Users/Adam/coder-grading';
const AX=['diagnosis','intuition','logic','clarity','decisiveness','prioritization','debugging','systems','skepticism','overall'];
const CHAMP=new Set(['gpt','o3mini','opus48']);
const mean=a=>a.reduce((x,y)=>x+y,0)/(a.length||1);
const rows=[];
for(const [pf,sf] of [['corr_blended.json','corr_scores.json'],['expA_blended_corrected.json','expA_scores_corrected.json']]){
  if(!fs.existsSync(`${CG}/${pf}`))continue;
  const pool=JSON.parse(fs.readFileSync(`${CG}/${pf}`,'utf8')); const by=Object.fromEntries(pool.map(e=>[e.id,e]));
  const sc=JSON.parse(fs.readFileSync(`${CG}/${sf}`,'utf8')).filter(r=>CHAMP.has(r.grader));
  const per={}; for(const r of sc){(per[r.id]||=[]).push(r.overall);}
  for(const id of Object.keys(per)){const e=by[id]; if(!e||e._src!=='OTHER')continue; rows.push({ov:mean(per[id]),text:(e.complaint||'').replace(/\s+/g,' ').trim()});}
}
rows.sort((a,b)=>a.ov-b.ov);
console.log('=== bottom 22 field turns (overall score) — signal or noise? ===');
rows.slice(0,22).forEach((r,i)=>console.log((i+1)+'. ['+r.ov.toFixed(1)+'] '+r.text.slice(0,130)));
console.log('\n=== distribution ===');
const all=rows.map(r=>r.ov);
const band=(lo,hi)=>all.filter(v=>v>=lo&&v<hi).length;
console.log('n',all.length,'| <3:',band(0,3),' 3-4:',band(3,4),' 4-5:',band(4,5),' 5-6:',band(5,6),' 6-7:',band(6,7),' >=7:',band(7,11));
