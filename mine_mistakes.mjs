// Mine Adam's REAL mistakes from the grading runs -> seeds for personalized drills.
// For each of his turns, find the axis he scored lowest on; keep the turn + that weak skill + grader notes.
import fs from 'fs';
const CG = 'C:/Users/Adam/coder-grading';
const AXIS2SKILL = { debugging:'bug', diagnosis:'problem', clarity:'clear', logic:'thinking', systems:'ripples', skepticism:'doubt', prioritization:'first', decisiveness:'first' };
const AXES = Object.keys(AXIS2SKILL);
const CHAMP = new Set(['gpt','o3mini','opus48']);
const mean = a => a.reduce((x,y)=>x+y,0)/(a.length||1);

const sources = [
  ['expA_blended_corrected.json','expA_scores_corrected.json'],
  ['corr_blended.json','corr_scores.json'],
];
const seen = new Set(); const mistakes = [];
for (const [poolF, scoreF] of sources) {
  if (!fs.existsSync(`${CG}/${poolF}`) || !fs.existsSync(`${CG}/${scoreF}`)) continue;
  const pool = JSON.parse(fs.readFileSync(`${CG}/${poolF}`,'utf8'));
  const byId = Object.fromEntries(pool.map(e=>[e.id,e]));
  const rows = JSON.parse(fs.readFileSync(`${CG}/${scoreF}`,'utf8')).filter(r=>CHAMP.has(r.grader));
  const per = {};
  for (const r of rows) { const e=byId[r.id]; if(!e||e._src!=='MINE')continue; (per[r.id]||={ax:{},notes:[]}); for(const a of AXES)(per[r.id].ax[a]||=[]).push(r[a]); if(r.note)per[r.id].notes.push(r.note); }
  for (const id of Object.keys(per)) {
    const e = byId[id]; const text = (e.complaint||'').trim();
    if (!text || text.length < 25) continue;
    const key = text.slice(0,80).toLowerCase(); if (seen.has(key)) continue; seen.add(key);
    // weakest mapped axis for this turn (for the score) ...
    let worst=null, wv=99; for (const a of AXES){ const m=mean(per[id].ax[a]||[5]); if(m<wv){wv=m;worst=a;} }
    if (wv >= 5.0) continue;                 // only real misses
    // ... but assign the SKILL from the grader note (the real failure mode), not the noisy lowest axis
    const note = (per[id].notes[0]||'').toLowerCase();
    let skill = AXIS2SKILL[worst];
    if (/problem|identif|root|what.?s wrong|symptom/.test(note)) skill='problem';
    else if (/vague|unclear|clarity|clear|specif|actionable|ambig|direction|requirement/.test(note)) skill='clear';
    else if (/delegat|priorit|first|scope|focus/.test(note)) skill='first';
    else if (/assum|verif|check|confirm/.test(note)) skill='doubt';
    else if (/ripple|impact|touch|downstream|cross/.test(note)) skill='ripples';
    mistakes.push({ text: text.slice(0,400), skill, axis: worst, score: +wv.toFixed(1), note: per[id].notes[0]||'' });
  }
}
mistakes.sort((a,b)=>a.score-b.score);
fs.writeFileSync('C:/Users/Adam/whetstone/my_mistakes.json', JSON.stringify(mistakes,null,1));
const by={}; for(const m of mistakes)by[m.skill]=(by[m.skill]||0)+1;
console.log('real mistakes mined:', mistakes.length, '| by skill:', JSON.stringify(by));
console.log('worst 5:'); mistakes.slice(0,5).forEach(m=>console.log(`  (${m.score} ${m.skill}) ${m.text.replace(/\s+/g,' ').slice(0,90)} | ${m.note.slice(0,60)}`));
