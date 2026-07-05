// Whetstone FORGE — the one engine. Fills skill×level cells, makes personalized drills from real mistakes,
// validates across two models, dedupes, maintains a spare buffer, writes items.js, optionally pushes.
// Flags (env): PERCELL=4 MAXLEVEL=4 PERSONAL=1 SPARE=100 PUSH=0 DEEPEN=0
import fs from 'fs';
import { askGPT, askOpus48 } from 'file:///C:/Users/Adam/tools/council.mjs';

const DIR = 'C:/Users/Adam/whetstone';
const PERCELL = +(process.env.PERCELL || 4);
const MAXLEVEL = +(process.env.MAXLEVEL || 4);
const PERSONAL = process.env.PERSONAL !== '0';
const SPARE = +(process.env.SPARE || 100);
const PUSH = process.env.PUSH === '1';
const DEEPEN = process.env.DEEPEN === '1';

const SKILLS = {
  bug:'Finding the real bug', problem:'Naming the real problem', clear:'Being clear',
  thinking:'Thinking it through', ripples:'Seeing the ripples', doubt:'Not taking it on faith',
  first:'First things first', flip:'Flipping the problem', good:'Knowing what is good',
};
const PLAIN = {
  bug:'chase the cause on purpose instead of just trying things',
  problem:'say what is actually wrong, not just the first thing you noticed',
  clear:'ask for exactly what you want so nobody has to guess',
  thinking:'show the steps instead of jumping straight to an answer',
  ripples:'notice what else a change quietly touches',
  doubt:'check it instead of assuming it is fine',
  first:'do the thing that matters most before the rest',
  flip:'look at a stuck problem from a new angle',
  good:'tell real quality from something that just looks shiny',
};
const LEVELTEXT = lv => [
  'an easy everyday moment where the better answer is fairly clear',
  'a moment where the weaker answer is genuinely tempting',
  'a subtle moment where both answers look fine and only one is quietly better',
  'an expert moment where the difference is a fine, almost invisible edge',
][Math.min(lv,4)-1] || `an extremely subtle level-${lv} moment that only a master would catch — both answers look excellent`;

const VOICE = `Tutoring a brilliant instinctive person who will NEVER learn formal computer terms (like teaching the Beatles, who never read music). NO jargon at all — no "refactor", "root cause", "idempotent", "race condition", "scope", "stack trace", "edge case", "side effect". Plain words a smart friend uses. Teach by feel and concrete example. Output strict JSON only.`;
const txt = r => (typeof r==='string'?r:(r?.content||r?.text||JSON.stringify(r)));
const grab = raw => { const m=String(raw).match(/\{[\s\S]*\}/); if(!m)return null; try{return JSON.parse(m[0]);}catch{return null;} };
const sleep = ms => new Promise(r=>setTimeout(r,ms));
async function call(fn,user,sys){for(let i=0;i<4;i++){try{const r=txt(await fn([{role:'user',content:user}],sys));if(r)return r;}catch{}await sleep(900*2**i);}return null;}
const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim().slice(0,90);

let items = fs.existsSync(`${DIR}/items.json`) ? JSON.parse(fs.readFileSync(`${DIR}/items.json`,'utf8')) : [];
// normalize older items to the level schema
items.forEach(it => { it.level = it.level || it.difficulty || 1; it.skill = SKILLS[it.sk] || it.skill; });
const dedupe = new Set(items.map(it => norm(it.scenario||'')));
let nextId = items.reduce((m,it)=>Math.max(m, +(String(it.id).replace(/\D/g,''))||0), 0);

function genPrompt(sk, lv){ return `Write ONE drill teaching "${SKILLS[sk]}" — ${PLAIN[sk]}.
Difficulty: ${LEVELTEXT(lv)}.
Give a short real coding-life situation (1-3 plain sentences), then TWO things a person could say or do. ONE is clearly better at "${SKILLS[sk]}"; the other sounds reasonable but is weaker at it. 1-2 plain sentences each. No jargon.
Output ONLY JSON: {"scenario":"...","optionA":"...","optionB":"...","better":"A or B","why":"one plain sentence on what makes the better one better, in feel-words","trap":"one plain sentence on why the weaker one tempts you"}`; }
function personalPrompt(seed){ return `A developer keeps making this kind of mistake with "${SKILLS[seed.skill]}" (${PLAIN[seed.skill]}).
Flavor of their real miss: "${(seed.text||'').slice(0,200)}" — what was weak: "${seed.note}".
Create a FRESH, realistic coding drill (do NOT reuse their words or topic) that teaches the opposite. Option B must embody this same weak instinct in a new scenario; Option A is the stronger move. Plain language, no jargon.
Output ONLY JSON: {"scenario":"...","optionA":"...","optionB":"...","better":"A or B","why":"...","trap":"..."}`; }
function valPrompt(it){ return `Situation: ${it.scenario}\nA: ${it.optionA}\nB: ${it.optionB}\nWhich is better at "${SKILLS[it.sk]}" (${PLAIN[it.sk]})? Output ONLY JSON: {"better":"A or B"}`; }

// build the work list
const jobs = [];
const have = (sk,lv) => items.filter(it=>it.sk===sk&&it.level===lv).length;
for (const sk of Object.keys(SKILLS)) {
  const maxlv = DEEPEN ? MAXLEVEL+1 : MAXLEVEL;     // DEEPEN adds a frontier level
  for (let lv=1; lv<=maxlv; lv++){ const need = PERCELL - have(sk,lv); for(let i=0;i<need;i++) jobs.push({type:'gen',sk,lv}); }
}
if (PERSONAL && fs.existsSync(`${DIR}/my_mistakes.json`)) {
  const m = JSON.parse(fs.readFileSync(`${DIR}/my_mistakes.json`,'utf8'));
  const already = items.filter(it=>it.personalized).length;
  for (const seed of m.slice(0, Math.max(0, 70 - already))) jobs.push({type:'personal',seed});
}
// SPARE buffer: if total below a floor, add more general gen across cells
const floor = Object.keys(SKILLS).length*MAXLEVEL*PERCELL + SPARE;
let extra = Math.max(0, floor - (items.length + jobs.length));
const skKeys = Object.keys(SKILLS);
for (let i=0;i<extra;i++){ jobs.push({type:'gen', sk:skKeys[i%skKeys.length], lv:(i%MAXLEVEL)+1}); }

console.log(`have ${items.length} | jobs ${jobs.length} (gen+personal+spare) | target floor ${floor}`);
const GENS=[askOpus48,askGPT]; let idx=0,made=0,genFail=0,mismatch=0,dup=0;
async function worker(w){ while(idx<jobs.length){ const j=jobs[idx++]; const gen=GENS[(idx+w)%2]; const val=gen===askGPT?askOpus48:askGPT;
  const prompt = j.type==='personal'?personalPrompt(j.seed):genPrompt(j.sk,j.lv);
  const it = grab(await call(gen,prompt,VOICE)||'');
  if(!it||!it.scenario||!it.optionA||!it.optionB||!/^[AB]$/.test((it.better||'').trim())){genFail++;continue;}
  if(dedupe.has(norm(it.scenario))){dup++;continue;}
  it.sk = j.type==='personal'?j.seed.skill:j.sk; it.skill=SKILLS[it.sk];
  it.level = j.type==='personal'?1:j.lv; it.better=it.better.trim();
  if(j.type==='personal'){it.personalized=true;}
  const v = grab(await call(val,valPrompt(it),'Judge carefully, plainly. JSON only.')||'');
  if(!v||!/^[AB]$/.test((v.better||'').trim())){genFail++;continue;}
  if(v.better.trim()!==it.better){mismatch++;continue;}
  dedupe.add(norm(it.scenario)); it.id='w'+(++nextId); items.push(it); made++;
  if(made%6===0){ write(); process.stdout.write(`  made ${made} | dup ${dup} | genFail ${genFail} | mismatch ${mismatch}\n`); }
}}
function write(){ fs.writeFileSync(`${DIR}/items.json`,JSON.stringify(items,null,1)); fs.writeFileSync(`${DIR}/items.js`,'window.ITEMS = '+JSON.stringify(items)+';'); }
await Promise.all([0,1].map(worker));
write();
const byLv={}; for(const it of items){const k=it.sk+':L'+it.level;byLv[k]=(byLv[k]||0)+1;}
console.log(`\nFORGE DONE. total ${items.length} (made ${made}, dup ${dup}, genFail ${genFail}, mismatch ${mismatch}) | personalized ${items.filter(i=>i.personalized).length}`);

if (PUSH) {
  const { execSync } = await import('child_process');
  const TOKEN = (fs.readFileSync('C:/Users/Adam/.claude/projects/C--Users-Adam/memory/keys/github.md','utf8').match(/gh[a-z]_[A-Za-z0-9_]+/)||[])[0];
  try {
    execSync('git add items.js .gitignore', {cwd:DIR});
    execSync(`git -c user.email="adam@okfintris.com" -c user.name="wetlether" commit -q -m "forge: bank now ${items.length} drills"`, {cwd:DIR});
    execSync(`git push -q "https://${TOKEN}@github.com/wetlether/whetstone.git" main`, {cwd:DIR});
    console.log('pushed items.js to repo.');
  } catch(e){ console.log('push skipped/failed:', String(e.message).slice(0,120)); }
}
