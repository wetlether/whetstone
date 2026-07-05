// On-plan (no API) build: fill the missing Train skills, add the EXPLOIT module + verified PROFILE.
// Tell-gate is the free programmatic detector only (no GPT). Authored by Claude on the unlimited plan.
import fs from 'fs';
const DIR='C:/Users/Adam/whetstone';
const SKILLS={bug:'Finding the real bug',problem:'Naming the real problem',clear:'Being clear',thinking:'Thinking it through',ripples:'Seeing the ripples',doubt:'Not taking it on faith',first:'First things first',flip:'Flipping the problem',good:'Knowing what is good'};

// ---- new TRAIN items for the four skills that had no survivors (mirror-form, close-cut reasons) ----
const NEW1=[
{sk:'bug',level:2,scenario:"An app crashes for one user but works fine for everyone else.",A:"Look at what's different about that one user's account or setup.",B:"Scatter extra error messages through the code and wait for the next crash.",better:'A',whyBetter:"A crash that hits only one person points at something specific to them; the difference is the lead, not more noise to wait on.",whyOther:"Adding error messages feels productive and thorough.",reasons:[
 {t:"A crash that hits only one person almost always traces to something specific in their data or setup, so finding that difference is the fastest path to the cause.",ok:true},
 {t:"Extra error messages are reasonable, but they only help the next time it happens, so it's slower than chasing the difference that already exists.",ok:false},
 {t:"That one user is probably doing something unusual, so the move is to show them the normal way to use it.",ok:false},
 {t:"One crash among many working users is low priority, so a few error messages is the proportionate amount of effort.",ok:false}]},
{sk:'thinking',level:2,scenario:"You're about to make a change that's hard to undo, and you're fairly sure it's right.",A:"Make the change; you've thought about it enough.",B:"Sketch what happens if you're wrong before you commit to it.",better:'B',whyBetter:"When a move is hard to reverse, the cost of being wrong is high enough to spend a minute imagining the failure first.",whyOther:"You're fairly sure, and acting feels decisive.",reasons:[
 {t:"Because the change is hard to reverse, a wrong call is expensive, so a quick look at the failure case is cheap insurance against a costly mistake.",ok:true},
 {t:"You're only fairly sure rather than certain, so you should keep gathering information until you're completely confident before acting.",ok:false},
 {t:"Imagining the failure case is good practice on every change, reversible or not, so it's just the disciplined habit here.",ok:false},
 {t:"Hard-to-undo changes should generally be avoided, so the real move is to find a more reversible way to do it.",ok:false}]},
{sk:'ripples',level:2,scenario:"You speed the app up by keeping a saved copy of data instead of fetching it fresh each time.",A:"Ship it; faster is better and the data rarely changes.",B:"Decide what happens when the saved copy and the real data disagree first.",better:'B',whyBetter:"A saved copy can fall out of step with the truth, so the speed win quietly creates a 'which one is right' problem you'll have to answer.",whyOther:"The data rarely changes, so it feels like a clean free win.",reasons:[
 {t:"A saved copy can drift apart from the real data, so the speed gain quietly creates a 'which one wins when they differ' question you'll pay for later if you skip it.",ok:true},
 {t:"Keeping a copy uses more memory, so the first thing to check is whether you can afford the extra space.",ok:false},
 {t:"The data rarely changes, so any disagreements will be too rare to be worth planning for.",ok:false},
 {t:"Fetching fresh is always safer than keeping copies, so the right answer is not to do this at all.",ok:false}]},
{sk:'doubt',level:2,scenario:"Someone tells you the slow part of the app is the database.",A:"Start making the database faster.",B:"Measure where the time actually goes before touching anything.",better:'B',whyBetter:"'It's the database' is a guess until you measure; the slow part often turns out to be somewhere nobody suspected.",whyOther:"It's a confident, specific lead from someone who'd know.",reasons:[
 {t:"Where the time goes is something you can measure, and slowness often hides somewhere nobody guessed, so measuring first stops you speeding up the wrong thing.",ok:true},
 {t:"The person probably knows the system well, so their guess is a reasonable place to begin the work.",ok:false},
 {t:"Databases are the most common cause of slowness, so betting on it is just playing the odds.",ok:false},
 {t:"Measuring needs tools and setup, so for a quick win it's faster to just try the database first.",ok:false}]},
];

// ---- EXPLOIT module: pick the approach that fits Adam's VERIFIED strengths. No option names a skill. ----
const EXPLOIT=[
{scenario:"A feature you built isn't catching on with users. You could:",options:[
 "Recast what the feature even is by comparing it to something people already love.",
 "Dig into the usage numbers to find exactly where people drop off.",
 "Tighten the wording and labels so the feature reads more clearly."],best:0,strength:'reframing',
 why:"Reframing is your sharpest verified move — finding the familiar thing it's *like* is where you consistently land your best ideas. The other two lean on your weaker, more grind-it-out skills."},
{scenario:"You're choosing between three rough product directions. The best fit for you is to:",options:[
 "Pick the one whose projected numbers point to the biggest market.",
 "Pick the one you can feel is right even before you can fully justify it.",
 "Pick the one that would be the cleanest and simplest to build."],best:1,strength:'taste',
 why:"Your taste — knowing what's good before you can prove it — graded well above the field. At a fork like this, that instinct is your edge; the analysis can come after."},
{scenario:"A technical problem has you stuck. Your best angle is to:",options:[
 "Grind through the logic one careful step at a time until it cracks.",
 "Find a completely different way to look at the whole problem.",
 "Test each piece in turn to isolate exactly where it breaks."],best:1,strength:'reframing',
 why:"Flipping the problem is your strength; step-by-step logic and methodical isolation are your weaker axes — exactly the parts worth handing to a tool or a teammate."},
{scenario:"You and a teammate disagree on a design. You should lean on:",options:[
 "A detailed written argument laying out every reason point by point.",
 "Your read of what will actually feel right to the people using it.",
 "A breakdown of what each option would take to build."],best:1,strength:'taste',
 why:"Your sense of what feels right is verified-strong; a long written case plays straight into your weakest axis. Lead with the read, support it lightly."},
{scenario:"You need a name for a new product. Best to:",options:[
 "Run a quick survey on a few candidate names.",
 "Coin something original that captures the feeling of it.",
 "Choose the clearest, most plainly descriptive name."],best:1,strength:'originality',
 why:"Naming and original coinage scored among your top moves. The descriptive-clarity route is your weak axis; the survey outsources a call you're actually good at."},
{scenario:"A big but vague opportunity just appeared. Your move:",options:[
 "Map out the detailed steps before deciding anything.",
 "See the shape of where it could go and what it could become.",
 "Check whether the current setup can even support it."],best:1,strength:'vision',
 why:"Seeing the shape of where something could go is your strength; detailed step-mapping and systems-checking are weaker for you — bring others in for those once you've set the direction."},
];

const PROFILE={
 strengths:[
  {name:'Reframing (your peak)',desc:"Taking a stuck problem and recasting it through a vivid comparison until a new path opens."},
  {name:'Taste',desc:"Knowing what's genuinely good before you can fully explain why."},
  {name:'Originality & naming',desc:"Coining and inventing — the fresh angle others don't reach for."},
  {name:'Vision',desc:"Seeing the shape of where something could go."}],
 weaknesses:[
  {name:'Showing the reasoning',desc:"Spelling out the steps so others can follow — your widest gap."},
  {name:'Naming the real problem',desc:"Stating exactly what's wrong before jumping to a fix."},
  {name:'Systematic debugging',desc:"Isolating a fault on purpose instead of by feel."},
  {name:'Being precise',desc:"Asking for exactly what you want so nobody has to guess."}],
};

// ---- merge ----
const VIRTUE=/\b(check|verify|confirm|make sure|first|before|ensure|careful|double-?check|properly)\b/i;
function tellLeak(it){const la=it.A.length,lb=it.B.length;if(Math.min(la,lb)/Math.max(la,lb)<0.6)return 'length';const va=VIRTUE.test(it.A),vb=VIRTUE.test(it.B);if(va!==vb)return 'virtue';return null;}
const items=JSON.parse(fs.readFileSync(`${DIR}/items.json`,'utf8'));
const norm=s=>s.toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim().slice(0,90);
const have=new Set(items.map(it=>norm(it.scenario)));
let id=items.reduce((m,it)=>Math.max(m,+(String(it.id).replace(/\D/g,''))||0),0);
let added=0,cut=0;
for(const r of NEW1){ if(have.has(norm(r.scenario)))continue; const leak=tellLeak(r); if(leak){cut++;console.log('  CUT(tell:'+leak+')',r.scenario.slice(0,45));continue;} r.id='w'+(++id);r.sk=r.sk;r.skill=SKILLS[r.sk];items.push(r);have.add(norm(r.scenario));added++; }
fs.writeFileSync(`${DIR}/items.json`,JSON.stringify(items,null,1));
fs.writeFileSync(`${DIR}/items.js`,'window.ITEMS = '+JSON.stringify(items)+';\nwindow.EXPLOIT = '+JSON.stringify(EXPLOIT)+';\nwindow.PROFILE = '+JSON.stringify(PROFILE)+';');
const sks=[...new Set(items.filter(i=>!i.contested).map(i=>i.sk))];
console.log(`TRAIN items ${items.length} (added ${added}, cut ${cut}) across skills: ${sks.join(', ')}`);
console.log(`EXPLOIT items ${EXPLOIT.length} | profile strengths ${PROFILE.strengths.length} weaknesses ${PROFILE.weaknesses.length}`);
