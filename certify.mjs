// Cue-attacker certification of the weak-spot batch (the 13 newest graded items).
// Three non-Claude models may use ONLY surface form, forbidden to reason about real merit.
// A/B chance=50%, reason chance=25%. An item PASSES if the attackers can't beat chance (<=1 of 3 crack it).
import fs from 'fs';
import { askGPT, askO3Mini, askGemini } from 'file:///C:/Users/Adam/tools/council.mjs';
const DIR='C:/Users/Adam/whetstone';
const items=JSON.parse(fs.readFileSync(`${DIR}/items.json`,'utf8'))
  .filter(i=>!i.contested&&/^[AB]$/.test(i.better||''))
  .sort((a,b)=>(+String(b.id).replace(/\D/g,''))-(+String(a.id).replace(/\D/g,'')))
  .slice(0,13);
const txt=r=>(typeof r==='string'?r:(r?.content||r?.text||JSON.stringify(r)));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ask(fn,user,sys){for(let i=0;i<3;i++){try{const r=txt(await fn([{role:'user',content:user}],sys));if(r)return r;}catch{}await sleep(700*2**i);}return '';}
const ATT=[['gpt',askGPT],['o3',askO3Mini],['gem',askGemini]];

const AB_SYS='You are guessing the answer to a hidden multiple-choice quiz with NO subject knowledge. You may use ONLY surface cues: wording, length, tone, which option sounds more "correct/responsible/careful/thorough". You are FORBIDDEN to reason about which is actually better in reality. Output ONLY JSON {"guess":"A or B"}.';
const R_SYS='Four explanations follow; exactly ONE is the keyed correct answer. You have NO subject knowledge and are FORBIDDEN to reason about which is actually right. Using ONLY surface form (length, specificity, phrasing, which sounds most textbook-correct), guess which is the keyed one. Output ONLY JSON {"guess":N} where N is 1-4.';

let abHits=0,abN=0,rHits=0,rN=0; const fails=[];
for(const it of items){
  // ---- A/B attack ----
  const abUser=`A: ${it.A}\nB: ${it.B}\nWhich was written to be the intended correct answer?`;
  let abCrack=0;
  for(const [n,fn] of ATT){const m=(await ask(fn,abUser,AB_SYS)).match(/"guess"\s*:\s*"?([AB])/i);abN++;if(m&&m[1].toUpperCase()===it.better){abCrack++;abHits++;}}
  // ---- reasons attack (shuffle, hide the key) ----
  const order=it.reasons.map((r,i)=>({r,i})).sort(()=>Math.random()-.5);
  const keyPos=order.findIndex(o=>o.r.ok)+1;
  const rUser=order.map((o,i)=>`${i+1}. ${o.r.t}`).join('\n');
  let rCrack=0;
  for(const [n,fn] of ATT){const m=(await ask(fn,rUser,R_SYS)).match(/"guess"\s*:\s*([1-4])/);rN++;if(m&&+m[1]===keyPos){rCrack++;rHits++;}}
  const pass = abCrack<=1 && rCrack<=1;
  if(!pass)fails.push({id:it.id,sk:it.sk,abCrack,rCrack,scenario:it.scenario.slice(0,60)});
  console.log(`${it.id} ${it.sk.padEnd(8)} A/B cracked ${abCrack}/3 | reason cracked ${rCrack}/3 | ${pass?'PASS':'*** FAIL'}`);
}
console.log(`\n=== certification ===`);
console.log(`A/B attacker accuracy: ${Math.round(100*abHits/abN)}% (chance 50%)`);
console.log(`reason attacker accuracy: ${Math.round(100*rHits/rN)}% (chance 25%)`);
console.log(`passed: ${items.length-fails.length}/${items.length}`);
if(fails.length){console.log('FAILS (rework these):');fails.forEach(f=>console.log('  '+f.id,f.sk,'ab'+f.abCrack,'r'+f.rCrack,'|',f.scenario));}
fs.writeFileSync(`${DIR}/_cert_result.json`,JSON.stringify({abAcc:abHits/abN,rAcc:rHits/rN,fails},null,1));
