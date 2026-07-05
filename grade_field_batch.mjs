// Pool a fresh Claude-graded field batch into the baseline. My (Claude) per-turn scores below, on the
// same 9 axes, full-range, field-level — consistent with the in-box grader that scores real users.
import fs from 'fs';
const CG='C:/Users/Adam/coder-grading', DIR='C:/Users/Adam/whetstone';
const AX=['diagnosis','intuition','logic','clarity','decisiveness','prioritization','debugging','systems','skepticism','overall'];
const CHAMP=new Set(['gpt','o3mini','opus48']);
const mean=a=>a.reduce((x,y)=>x+y,0)/(a.length||1);
const sd=a=>{const m=mean(a);return Math.sqrt(mean(a.map(x=>(x-m)**2)))||1;};

// my Claude grades for the 25 kept field turns — [diag,intu,logic,clar,decis,prior,debug,sys,skep,overall]
const NEW=[
[5,6,6,6,6,5,4,5,4,5],[4,5,4,6,6,5,3,4,3,5],[5,5,4,5,5,5,5,4,5,5],[3,5,3,4,4,4,3,3,3,4],
[5,6,6,6,5,7,4,6,6,6],[5,5,5,6,5,5,4,5,4,5],[3,3,2,3,3,3,2,3,2,3],[4,5,4,5,6,5,3,4,3,5],
[6,7,7,6,6,6,5,7,6,7],[5,5,5,6,5,5,5,5,6,5],[7,5,6,7,5,5,6,5,5,6],[4,5,4,4,4,4,4,4,6,5],
[5,5,5,6,4,4,4,5,5,5],[6,5,5,6,5,5,6,5,5,6],[4,4,4,6,4,3,3,3,3,4],[5,6,5,5,4,5,4,6,5,5],
[5,5,5,7,7,7,5,5,5,6],[7,6,6,7,5,5,6,6,5,6],[4,5,5,7,7,6,4,5,5,6],[6,6,6,6,5,6,6,5,6,6],
[4,5,4,6,7,6,4,4,4,5],[7,7,7,6,5,6,6,7,6,7],[5,6,6,5,6,7,4,6,6,6],[5,7,6,6,5,5,5,6,7,6],
[5,5,5,7,6,6,5,5,5,6],
];

// existing field vectors (recompute per-entry axis means from the council runs, OTHER rows)
const existing=[];
for(const [pf,sf] of [['corr_blended.json','corr_scores.json'],['expA_blended_corrected.json','expA_scores_corrected.json']]){
  if(!fs.existsSync(`${CG}/${pf}`))continue;
  const pool=JSON.parse(fs.readFileSync(`${CG}/${pf}`,'utf8')); const src=Object.fromEntries(pool.map(e=>[e.id,e._src]));
  const rows=JSON.parse(fs.readFileSync(`${CG}/${sf}`,'utf8')).filter(r=>CHAMP.has(r.grader));
  const per={}; for(const r of rows){(per[r.id]||={});for(const a of AX)(per[r.id][a]||=[]).push(r[a]);}
  for(const id of Object.keys(per)){ if(src[id]!=='OTHER')continue; existing.push(AX.map(a=>mean(per[id][a]))); }
}
const all=[...existing, ...NEW];
const BASELINE={}; for(let k=0;k<AX.length;k++){const col=all.map(v=>v[k]); BASELINE[AX[k]]={mean:+mean(col).toFixed(2),sd:+sd(col).toFixed(2),n:col.length};}

// keep DEMO (Adam's profile) as-is from current score_data.js
const cur=fs.readFileSync(`${DIR}/score_data.js`,'utf8'); const demo=(cur.match(/window\.DEMO = (\{[^;]*\})/)||[])[1]||'{}';
fs.writeFileSync(`${DIR}/score_data.js`,'window.BASELINE = '+JSON.stringify(BASELINE)+';\nwindow.DEMO = '+demo+';');

// update the BASELINE constant inside score_engine.mjs too
let eng=fs.readFileSync(`${DIR}/score_engine.mjs`,'utf8');
const bl='export const BASELINE = '+JSON.stringify(Object.fromEntries(AX.map(a=>[a,{mean:BASELINE[a].mean,sd:BASELINE[a].sd}])))+';';
eng=eng.replace(/export const BASELINE = \{[\s\S]*?\};/, bl);
fs.writeFileSync(`${DIR}/score_engine.mjs`,eng);

console.log('baseline grown: field n '+existing.length+' -> '+all.length+' (+'+NEW.length+' Claude-graded)');
for(const a of AX)console.log('  '+a.padEnd(15),'mean',BASELINE[a].mean,'sd',BASELINE[a].sd);
