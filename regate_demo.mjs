// Re-gate the DEMO profile: average Adam's axis scores over his JUDGMENT turns only (same noise gate
// as the field), so the demo card is apples-to-apples. Reuses isJudgmentTurn from the box grader.
import fs from 'fs';
import { isJudgmentTurn } from './score_engine.mjs';
const CG='C:/Users/Adam/coder-grading', DIR='C:/Users/Adam/whetstone';
const AX=['diagnosis','intuition','logic','clarity','decisiveness','prioritization','debugging','systems','skepticism','overall'];
const CHAMP=new Set(['gpt','o3mini','opus48']);
const mean=a=>a.reduce((x,y)=>x+y,0)/(a.length||1);
const erf=x=>{const s=x<0?-1:1;x=Math.abs(x);const t=1/(1+0.3275911*x);return s*(1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x));};
const pct=(v,m,s)=>Math.round(100*0.5*(1+erf((v-m)/(s*Math.SQRT2))));

const mineAll=[], mineKept=[];
for(const [pf,sf] of [['corr_blended.json','corr_scores.json'],['expA_blended_corrected.json','expA_scores_corrected.json']]){
  if(!fs.existsSync(`${CG}/${pf}`))continue;
  const pool=JSON.parse(fs.readFileSync(`${CG}/${pf}`,'utf8')); const by=Object.fromEntries(pool.map(e=>[e.id,e]));
  const sc=JSON.parse(fs.readFileSync(`${CG}/${sf}`,'utf8')).filter(r=>CHAMP.has(r.grader));
  const per={}; for(const r of sc){(per[r.id]||={});for(const a of AX)(per[r.id][a]||=[]).push(r[a]);}
  for(const id of Object.keys(per)){const e=by[id]; if(!e||e._src!=='MINE')continue;
    const vec=AX.map(a=>mean(per[id][a])); const text=(e.complaint||'').replace(/\s+/g,' ').trim();
    mineAll.push(vec); if(isJudgmentTurn(text)) mineKept.push(vec);
  }
}
const DEMO={}, OLD={}; for(let k=0;k<AX.length;k++){ DEMO[AX[k]]=+mean(mineKept.map(v=>v[k])).toFixed(2); OLD[AX[k]]=+mean(mineAll.map(v=>v[k])).toFixed(2); }

const B=JSON.parse(fs.readFileSync(`${DIR}/score_data.js`,'utf8').match(/window\.BASELINE = (\{.*?\});/s)[1]);
console.log('your turns:',mineAll.length,'| judgment turns kept:',mineKept.length,'| dropped as noise:',mineAll.length-mineKept.length);
console.log('\n=== demo profile re-gated (apples-to-apples vs cleaned field) ===');
for(const a of AX)console.log('  '+a.padEnd(15),'old',OLD[a],'-> gated',DEMO[a],'| pct',pct(OLD[a],B[a].mean,B[a].sd)+'th -> '+pct(DEMO[a],B[a].mean,B[a].sd)+'th');

const cur=fs.readFileSync(`${DIR}/score_data.js`,'utf8');
fs.writeFileSync(`${DIR}/score_data.js`, cur.replace(/window\.DEMO = \{[^;]*\};/, 'window.DEMO = '+JSON.stringify(DEMO)+';'));
console.log('\nwrote re-gated DEMO. overall:',OLD.overall,'->',DEMO.overall,'( '+pct(OLD.overall,B.overall.mean,B.overall.sd)+'th -> '+pct(DEMO.overall,B.overall.mean,B.overall.sd)+'th )');
