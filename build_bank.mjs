// Whetstone bank rebuild — mirror-form, tell-free drills (on-plan authored), gated two ways:
//  (1) free programmatic tell-detector (length asymmetry + virtue-word leak)
//  (2) a cue-attacker (one cheap model) that may use ONLY wording/length/tone, not real reasoning —
//      if it can guess the intended answer, the item telegraphs and is CUT. Keep set must sit ~chance.
import fs from 'fs';
import { askGPT } from 'file:///C:/Users/Adam/tools/council.mjs';
const DIR = 'C:/Users/Adam/whetstone';
const SKILLS={bug:'Finding the real bug',problem:'Naming the real problem',clear:'Being clear',thinking:'Thinking it through',ripples:'Seeing the ripples',doubt:'Not taking it on faith',first:'First things first',flip:'Flipping the problem',good:'Knowing what is good'};

// ---- authored mirror-form drills. g=graded (has better), c=contested (no wrong) ----
const RAW=[
// problem
{sk:'problem',level:1,scenario:"A user says checkout 'didn't work.' You get one question before they're gone.",A:"Ask what they saw on the screen when it failed.",B:"Ask which device and browser they were on.",better:'A',whyBetter:"What they saw points at the actual failure; the device is a guess about the cause before you even know the symptom.",whyOther:"Asking about device feels like the seasoned move, since bugs are often device-specific."},
{sk:'problem',level:2,p:1,scenario:"A part of the app annoys you and you want it changed.",A:"Tell them what the part currently does wrong.",B:"Tell them how you'd like the part to look instead.",better:'A',whyBetter:"Naming what's wrong lets them fix the cause; handing over your preferred look can fix a symptom and miss the real issue.",whyOther:"Describing the fix you picture feels more concrete and helpful."},
{sk:'problem',level:2,scenario:"A sales number comes in lower than you expected.",A:"Check whether the number is wrong or your expectation was.",B:"Check the calculation that produced the number.",better:'A',whyBetter:"Sometimes the number is right and the assumption is the bug; checking that first can save the whole hunt.",whyOther:"A surprising number reads as a math mistake, so digging into the calc feels right."},
{sk:'problem',level:3,scenario:"Two people say the same screen is 'broken.'",A:"Ask each what they were trying to do when it broke.",B:"Reproduce the break on that screen yourself.",better:'A',whyBetter:"One complaint from two people can be two different problems; their intent separates them before you chase the wrong one.",whyOther:"Reproducing it yourself feels like the direct, hands-on path."},
// clear
{sk:'clear',level:1,p:1,scenario:"You want a button changed.",A:"Tell them to make the button bigger and blue.",B:"Tell them to make the button stand out more.",better:'A',whyBetter:"An exact change can't be misread; 'stand out more' is a dozen different buttons in their head versus yours.",whyOther:"'Stand out more' feels flexible, like you're trusting their eye."},
{sk:'clear',level:2,p:1,scenario:"You're handing off a task you'd rather not fully spell out.",A:"Give them the one boundary that matters; freedom on the rest.",B:"Give them full freedom and trust their judgment.",better:'A',whyBetter:"One named boundary prevents the one mistake that would hurt, while still leaving them room.",whyOther:"Full freedom feels respectful and gets it off your plate faster."},
{sk:'clear',level:2,scenario:"Your teammate keeps building the wrong thing from your written requests.",A:"Write the requests in more detail.",B:"Switch to a two-minute call before each task.",better:'B',whyBetter:"If they keep misreading your writing, more writing is more to misread; the problem may be the channel, not the detail.",whyOther:"More detail is the obvious fix and feels like trying harder."},
{sk:'clear',level:3,scenario:"You ask for 'the fix we talked about yesterday.'",A:"Restate the fix in one line.",B:"Link them back to yesterday's conversation.",better:'A',whyBetter:"A one-line restate costs you nothing and removes the guess; a link makes them re-derive what you already know.",whyOther:"Linking the source feels thorough and avoids repeating yourself."},
// first
{sk:'first',level:1,scenario:"Today you can fix a silent bug quietly corrupting everyone's saved data, or a loud broken feature one furious customer is emailing about. One, not both.",A:"Spend it on the silent data bug; the customer waits a day.",B:"Spend it on the furious customer; the data bug waits a day.",better:'A',whyBetter:"The data loss spreads to everyone and can't be undone; the customer relationship is loud but recoverable tomorrow.",whyOther:"A furious customer churns and tells others, and silence feels like permission to wait."},
{sk:'first',level:2,scenario:"Three features to add, one week.",A:"Build the one users actually asked for; park the others.",B:"Build a little of all three and see what lands.",better:'A',whyBetter:"One finished thing beats three halves when the week runs out, and the asked-for one already has demand.",whyOther:"Spreading across all three feels like keeping your options open."},
{sk:'first',level:3,scenario:"A loud annoying bug and a quiet risk that could lose data are both on today's list.",A:"Handle the quiet data risk first.",B:"Clear the loud annoying bug first.",better:'A',whyBetter:"Loud isn't the same as important; protect what you can't get back before the thing that's merely irritating.",whyOther:"The annoying bug is in your face and feels satisfying to kill."},
// ripples
{sk:'ripples',level:2,scenario:"You're renaming a setting from 'Sound' to 'Audio.'",A:"Change the word everywhere it appears, including old saved settings.",B:"Change the word where users see it.",better:'A',whyBetter:"Old saved data may still hold the word 'Sound,' so a half-rename quietly breaks the places that still expect it.",whyOther:"Changing what users see feels like the whole job; the rest is invisible."},
{sk:'ripples',level:3,scenario:"You want to let people stay signed in longer so sign-in feels faster.",A:"Make sessions last longer for the faster feel.",B:"Keep sessions short to protect shared computers.",better:'B',whyBetter:"A speed win in one place opens an account-safety hole on shared devices, which costs more than the saved seconds.",whyOther:"Faster, smoother sign-in reads as pure upside."},
// doubt
{sk:'doubt',level:1,scenario:"You're told a change is safe and won't affect anything else.",A:"Ship it on their word.",B:"Open one place that uses it and look first.",better:'B',whyBetter:"'Safe' is a claim, not a check; ten seconds of looking turns a hope into a fact.",whyOther:"Taking their word keeps things moving and trusts the person."},
{sk:'doubt',level:2,scenario:"A test passes and the team is relieved.",A:"Trust the green and move on.",B:"Check the green covers the case that broke last time.",better:'B',whyBetter:"A pass only proves what it tests; the real worry may not be in there at all.",whyOther:"Green is a clean, satisfying signal to stop looking."},
// thinking
{sk:'thinking',level:2,scenario:"You have a strong hunch what's wrong, and the change is hard to undo.",A:"Act on the hunch now and confirm as you go.",B:"Confirm the hunch first, then act.",better:'B',whyBetter:"When a move is hard to reverse, the cost of a wrong hunch is high enough to pay for a check first.",whyOther:"Acting now feels decisive and your hunches are usually good."},
{sk:'thinking',level:3,scenario:"An idea feels great in your head and you want to start building.",A:"Walk one real person through it end to end first.",B:"Start building and find the holes as you go.",better:'A',whyBetter:"Talking it through finds the holes for the price of a conversation; building finds them for the price of the build.",whyOther:"Building feels like progress while talking feels like delay."},
// flip
{sk:'flip',level:2,scenario:"You're stuck fitting a row of tabs onto a small phone screen.",A:"Shrink the tabs until they all fit.",B:"Drop the tabs; make it one scrolling list.",better:'B',whyBetter:"Shrinking fights the symptom; questioning whether it needs tabs at all dissolves the problem.",whyOther:"Shrinking is the direct next step when something won't fit."},
{sk:'flip',level:3,scenario:"People keep using a feature in a way you didn't intend.",A:"Add rules to stop the unintended use.",B:"Ask whether the unintended use is the better feature.",better:'B',whyBetter:"Misuse is often the product telling you what it wants to be; locking it down can kill the best thing you've got.",whyOther:"Unintended use looks like a problem to contain, not a hint to follow."},
// good
{sk:'good',level:2,scenario:"Two designs: one flashy, one plain but instantly usable.",A:"Pick the one a stranger could use without thinking.",B:"Pick the one that looks more impressive.",better:'A',whyBetter:"Quality is whether it works without thought; impressive-looking but confusing fails the only test that matters.",whyOther:"The flashy one photographs better and feels higher-end."},
{sk:'good',level:3,scenario:"Something you built works, but a small part still nags at you.",A:"Call it done; it works and the nag is just nerves.",B:"Chase the nag and name what's bothering you first.",better:'B',whyBetter:"A trained nag usually points at a real flaw you haven't worded yet; 'it works' is a tempting place to stop early.",whyOther:"It works, so shipping now feels efficient and the nag feels like overthinking."},
// bug
{sk:'bug',level:2,scenario:"A page breaks, but only sometimes.",A:"Reload and adjust things until it stops.",B:"Write down what you did each time it broke and look for what those times share.",better:'B',whyBetter:"The common thread across the broken moments names the cause; random adjusting can hide it instead of finding it.",whyOther:"Tinkering until it stops feels like fixing and sometimes works for a while."},
{sk:'bug',level:3,scenario:"Something broke today; you changed three things yesterday.",A:"Undo the three changes one at a time to see which did it.",B:"Fix the change you're most sure was the culprit.",better:'A',whyBetter:"Changing one thing at a time keeps the cause from hiding among the others; a confident guess can send you fixing the wrong one.",whyOther:"You have a strong hunch which change broke it, so going straight there feels faster."},
// contested (no wrong answer — you justify, we bank it)
{sk:'good',level:3,c:1,scenario:"A feature's ready. It'll delight most users and mildly annoy a few daily regulars.",A:"Ship now; handle the regulars' gripes if they show up.",B:"Hold two weeks so nobody gets annoyed.",caseA:"Speed and learning from real use often beat a hypothetical annoyance; the regulars may not even mind.",caseB:"Daily regulars are the people who keep you alive and talk about you; quietly annoying them is expensive and hard to see."},
{sk:'first',level:3,c:1,scenario:"The code under a feature is messy. You can clean it now or ship the next feature and clean later.",A:"Clean it now while you understand it.",B:"Ship the next feature; clean when it actually hurts.",caseA:"You'll never understand this code more than you do right now; later it's a stranger's house.",caseB:"Cleaning that never has to happen is wasted; let real pain tell you where to spend the effort."},
{sk:'clear',level:3,c:1,scenario:"A stakeholder asks for something you think is a mistake.",A:"Build it as asked; it's their call and their context.",B:"Push back once with your reasoning, then build it.",caseA:"They may see constraints you don't; doing it cleanly buys trust for the fights that matter more.",caseB:"Saying the risk once on the record is cheap, and silence can let an avoidable mistake through."},
];

const VIRTUE=/\b(check|verify|confirm|make sure|first|before|ensure|careful|double-?check|actually|properly|correct(ly)?)\b/i;
const txt=r=>(typeof r==='string'?r:(r?.content||r?.text||JSON.stringify(r)));
function tellLeak(it){ // free structural detector
  const la=it.A.length, lb=it.B.length; if(Math.min(la,lb)/Math.max(la,lb) < 0.6) return 'length';
  const va=VIRTUE.test(it.A), vb=VIRTUE.test(it.B); if(va!==vb) return 'virtue-word';
  return null;
}
async function attack(it){ // cue-attacker: form ONLY, must guess intended answer
  const sys='You are guessing the answer to a multiple-choice quiz WITHOUT any subject knowledge. You may use ONLY surface cues: wording, length, tone, how "correct" or "responsible" an option sounds. You are FORBIDDEN from reasoning about which is actually better in reality. Output ONLY JSON {"guess":"A or B"}.';
  const user=`Which option is written to be the intended correct answer?\nA: ${it.A}\nB: ${it.B}`;
  for(let i=0;i<3;i++){try{const m=txt(await askGPT([{role:'user',content:user}],sys)).match(/"guess"\s*:\s*"?([AB])/i);if(m)return m[1].toUpperCase();}catch{}await new Promise(r=>setTimeout(r,800*2**i));}
  return null;
}

const kept=[]; let cutTell=0, cutAttack=0, attackHits=0, attackN=0; let id=0;
for(const r of RAW){
  const it={id:'w'+(++id), sk:r.sk, skill:SKILLS[r.sk], level:r.level, scenario:r.scenario, A:r.A, B:r.B};
  if(r.p)it.personalized=true;
  if(r.c){ it.contested=true; it.caseA=r.caseA; it.caseB=r.caseB; kept.push(it); continue; } // contested: no answer to leak
  it.better=r.better; it.whyBetter=r.whyBetter; it.whyOther=r.whyOther;
  const leak=tellLeak(it); if(leak){cutTell++; console.log(`  CUT(tell:${leak}) ${it.scenario.slice(0,50)}`); continue;}
  const g=await attack(it); attackN++; if(g===it.better){attackHits++; cutAttack++; console.log(`  CUT(attacker guessed it) ${it.scenario.slice(0,50)}`); continue;}
  kept.push(it);
}
fs.writeFileSync(`${DIR}/items.json`,JSON.stringify(kept,null,1));
fs.writeFileSync(`${DIR}/items.js`,'window.ITEMS = '+JSON.stringify(kept)+';');
console.log(`\nBANK REBUILT: kept ${kept.length} | cut(tell) ${cutTell} | cut(attacker) ${cutAttack}`);
console.log(`cue-attacker accuracy on graded candidates: ${attackN?Math.round(100*attackHits/attackN):0}% (target ~50% = form tells you nothing)`);
console.log(`graded ${kept.filter(i=>!i.contested).length} | contested ${kept.filter(i=>i.contested).length} | personalized ${kept.filter(i=>i.personalized).length}`);
