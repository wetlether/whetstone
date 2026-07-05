// Decouple noise from the baseline: drop field "turns" that aren't human judgment at all
// (agent notifications, injected context/system prompts, tool ids, file/skill dumps). Recompute,
// show the shift, and write the cleaned baseline + the same gate into the box grader.
import fs from 'fs';
const CG='C:/Users/Adam/coder-grading', DIR='C:/Users/Adam/whetstone';
const AX=['diagnosis','intuition','logic','clarity','decisiveness','prioritization','debugging','systems','skepticism','overall'];
const CHAMP=new Set(['gpt','o3mini','opus48']);
const mean=a=>a.reduce((x,y)=>x+y,0)/(a.length||1);
const sd=a=>{const m=mean(a);return Math.sqrt(mean(a.map(x=>(x-m)**2)))||1;};
const erf=x=>{const s=x<0?-1:1;x=Math.abs(x);const t=1/(1+0.3275911*x);return s*(1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x));};
const pctile=(v,m,s)=>Math.round(100*0.5*(1+erf((v-m)/(s*Math.SQRT2))));

// the noise gate — "this isn't a human judgment turn"
const NOISE=[
 /toolu_[0-9a-z]/i, /\/(private\/tmp|var\/folders)\//i,
 /\bcompleted Agent\b|Agent ".*?" completed/i,
 /current git status|on branch .* up to date|changes not staged for commit/i,
 /^you are (an?|the)?\s*(ai|assistant|an ai)|you are working inside/i,
 /agents\.md|repository guidelines|## project structure/i,
 /idle_notification|"type"\s*:\s*"[a-z_]+"/i,
 /invokes the .*skill|thin wrapper that invokes/i,
 /\[\d+ checkpoints?\]/i,
 /^#\s+(create plan|implementation spec|specification)|^\/[a-z_]+\b/i,
 /^[0-9a-f]{12,}\b/i,
];
const isNoise=t=>!t||t.trim().length<15||NOISE.some(re=>re.test(t));

// existing field vectors WITH text
const field=[];
for(const [pf,sf] of [['corr_blended.json','corr_scores.json'],['expA_blended_corrected.json','expA_scores_corrected.json']]){
  if(!fs.existsSync(`${CG}/${pf}`))continue;
  const pool=JSON.parse(fs.readFileSync(`${CG}/${pf}`,'utf8')); const by=Object.fromEntries(pool.map(e=>[e.id,e]));
  const sc=JSON.parse(fs.readFileSync(`${CG}/${sf}`,'utf8')).filter(r=>CHAMP.has(r.grader));
  const per={}; for(const r of sc){(per[r.id]||={});for(const a of AX)(per[r.id][a]||=[]).push(r[a]);}
  for(const id of Object.keys(per)){const e=by[id]; if(!e||e._src!=='OTHER')continue; field.push({text:(e.complaint||'').replace(/\s+/g,' ').trim(),vec:AX.map(a=>mean(per[id][a]))});}
}
// my 25 known-clean Claude-graded field vectors (carried from grade_field_batch)
const NEW=[[5,6,6,6,6,5,4,5,4,5],[4,5,4,6,6,5,3,4,3,5],[5,5,4,5,5,5,5,4,5,5],[3,5,3,4,4,4,3,3,3,4],[5,6,6,6,5,7,4,6,6,6],[5,5,5,6,5,5,4,5,4,5],[3,3,2,3,3,3,2,3,2,3],[4,5,4,5,6,5,3,4,3,5],[6,7,7,6,6,6,5,7,6,7],[5,5,5,6,5,5,5,5,6,5],[7,5,6,7,5,5,6,5,5,6],[4,5,4,4,4,4,4,4,6,5],[5,5,5,6,4,4,4,5,5,5],[6,5,5,6,5,5,6,5,5,6],[4,4,4,6,4,3,3,3,3,4],[5,6,5,5,4,5,4,6,5,5],[5,5,5,7,7,7,5,5,5,6],[7,6,6,7,5,5,6,6,5,6],[4,5,5,7,7,6,4,5,5,6],[6,6,6,6,5,6,6,5,6,6],[4,5,4,6,7,6,4,4,4,5],[7,7,7,6,5,6,6,7,6,7],[5,6,6,5,6,7,4,6,6,6],[5,7,6,6,5,5,5,6,7,6],[5,5,5,7,6,6,5,5,5,6]];

const clean=field.filter(f=>!isNoise(f.text)); const noise=field.filter(f=>isNoise(f.text));
const baseVecsOld=[...field.map(f=>f.vec),...NEW];
const baseVecsNew=[...clean.map(f=>f.vec),...NEW];
function bl(vecs){const o={};for(let k=0;k<AX.length;k++){const c=vecs.map(v=>v[k]);o[AX[k]]={mean:+mean(c).toFixed(2),sd:+sd(c).toFixed(2),n:c.length};}return o;}
const OLD=bl(baseVecsOld), NEWB=bl(baseVecsNew);

console.log('field turns:',field.length,'| flagged NOISE:',noise.length,'('+Math.round(100*noise.length/field.length)+'%) | clean:',clean.length);
console.log('\nsample NOISE caught:'); noise.slice(0,6).forEach(n=>console.log('  ✂ '+n.text.slice(0,80)));
console.log('\n=== baseline shift (mean) — removing noise raises the field, so percentiles DROP (honest) ===');
const demo=JSON.parse('{'+(fs.readFileSync(`${DIR}/score_data.js`,'utf8').match(/window\.DEMO = \{([^;]*)\}/)||[])[1]+'}');
for(const a of AX)console.log('  '+a.padEnd(15),'old',OLD[a].mean,'-> new',NEWB[a].mean,' | demo',demo[a],'pct',pctile(demo[a],OLD[a].mean,OLD[a].sd)+'th -> '+pctile(demo[a],NEWB[a].mean,NEWB[a].sd)+'th');

// WRITE the cleaned baseline
fs.writeFileSync(`${DIR}/score_data.js`,'window.BASELINE = '+JSON.stringify(NEWB)+';\nwindow.DEMO = '+JSON.stringify(demo)+';');
let eng=fs.readFileSync(`${DIR}/score_engine.mjs`,'utf8');
eng=eng.replace(/export const BASELINE = \{[\s\S]*?\};/,'export const BASELINE = '+JSON.stringify(Object.fromEntries(AX.map(a=>[a,{mean:NEWB[a].mean,sd:NEWB[a].sd}])))+';');
// inject the same noise gate into extractTurns so the box scores users only on real judgment turns
if(!eng.includes('const NOISE_GATE')){
  const gate='\nconst NOISE_GATE=['+NOISE.map(r=>r.toString()).join(',')+'];\nexport const isJudgmentTurn=t=>!!t&&t.trim().length>=15&&!NOISE_GATE.some(re=>re.test(t));\n';
  eng=eng.replace('export function extractTurns(input) {', gate+'export function extractTurns(input) {');
  eng=eng.replace('return turns.filter(Boolean).slice(0, 60);','return turns.filter(isJudgmentTurn).slice(0, 60);');
  eng=eng.replace('if (Array.isArray(input)) return input.filter(t => typeof t === \'string\' && t.trim().length > 3);','if (Array.isArray(input)) return input.filter(t => typeof t === \'string\' && isJudgmentTurn(t));');
}
fs.writeFileSync(`${DIR}/score_engine.mjs`,eng);
console.log('\nwrote cleaned baseline (n='+NEWB.overall.n+') + noise gate into score_engine.mjs');
