// Freeze the FIELD baseline once: per-axis mean/SD from the field's graded turns (the OTHER rows).
// Also emit a real example profile (the MINE averages) to populate the demo card.
// Output: score_data.js  ->  window.BASELINE, window.DEMO  (consumed by score.html, no model needed)
import fs from 'fs';
const CG='C:/Users/Adam/coder-grading';
const AXES=['diagnosis','intuition','logic','clarity','decisiveness','prioritization','debugging','systems','skepticism','overall'];
const CHAMP=new Set(['gpt','o3mini','opus48']);
const mean=a=>a.reduce((x,y)=>x+y,0)/(a.length||1);
const sd=a=>{const m=mean(a);return Math.sqrt(mean(a.map(x=>(x-m)**2)))||1;};

// pool both graded runs for a fatter field sample
const srcs=[['corr_blended.json','corr_scores.json'],['expA_blended_corrected.json','expA_scores_corrected.json']];
const fieldByAxis={}, mineByAxis={};
for(const ax of AXES){fieldByAxis[ax]=[];mineByAxis[ax]=[];}
for(const [pf,sf] of srcs){
  if(!fs.existsSync(`${CG}/${pf}`)||!fs.existsSync(`${CG}/${sf}`))continue;
  const pool=JSON.parse(fs.readFileSync(`${CG}/${pf}`,'utf8'));
  const src=Object.fromEntries(pool.map(e=>[e.id,e._src]));
  const rows=JSON.parse(fs.readFileSync(`${CG}/${sf}`,'utf8')).filter(r=>CHAMP.has(r.grader));
  // per-entry mean per axis, bucketed by src
  const per={};
  for(const r of rows){(per[r.id]||={}); for(const ax of AXES){(per[r.id][ax]||=[]).push(r[ax]);}}
  for(const id of Object.keys(per)){const bucket=src[id]==='MINE'?mineByAxis:fieldByAxis;
    for(const ax of AXES)bucket[ax].push(mean(per[id][ax]));}
}
const BASELINE={}; const DEMO={};
for(const ax of AXES){ BASELINE[ax]={mean:+mean(fieldByAxis[ax]).toFixed(2),sd:+sd(fieldByAxis[ax]).toFixed(2),n:fieldByAxis[ax].length};
  DEMO[ax]=+mean(mineByAxis[ax]).toFixed(2); }
fs.writeFileSync('C:/Users/Adam/whetstone/score_data.js',
  'window.BASELINE = '+JSON.stringify(BASELINE)+';\nwindow.DEMO = '+JSON.stringify(DEMO)+';');
console.log('field baseline (mean/sd per axis), n field turns ~', BASELINE.overall.n);
for(const ax of AXES)console.log('  '+ax.padEnd(15), 'field', BASELINE[ax].mean, '±', BASELINE[ax].sd, '| demo', DEMO[ax]);
