// On-plan (no API) weak-spot drills: clarity(clear), debugging(bug), systems(ripples),
// prioritization(first), diagnosis(problem). Mirror-form + close-cut reasons. Free structural tell-gate.
import fs from 'fs';
const DIR='C:/Users/Adam/whetstone';
const SKILLS={bug:'Finding the real bug',problem:'Naming the real problem',clear:'Being clear',thinking:'Thinking it through',ripples:'Seeing the ripples',doubt:'Not taking it on faith',first:'First things first',flip:'Flipping the problem',good:'Knowing what is good'};
const R=[
// ---- clear (weakest) ----
{sk:'clear',level:2,scenario:"You want the dashboard to load faster.",A:"Cut it from loading all twelve charts at once to loading the three on screen.",B:"Make the dashboard load only what it needs to feel fast.",better:'A',whyBetter:"An exact change leaves no room to misread; 'what it needs' is your picture, not a spec they can build to.",whyOther:"'What it needs' sounds adaptive and trusting of their judgment.",reasons:[
 {t:"Naming the exact change — three visible charts instead of twelve — gives them one target; 'what it needs to feel fast' is your mental model, not something they can build to.",ok:true},
 {t:"Loading fewer charts is the obvious win, so spelling out the number just saves them a small decision.",ok:false},
 {t:"'What it needs' is risky mainly because they might cut charts you actually wanted kept on screen.",ok:false},
 {t:"Being specific matters most with a junior; a senior would infer 'what it needs' just fine.",ok:false}]},
{sk:'clear',level:2,scenario:"You're telling someone how to handle errors in the upload feature.",A:"Show a message and keep the other uploads going if one file fails.",B:"Handle a failed upload gracefully so it doesn't break everything.",better:'A',whyBetter:"'Gracefully' means a dozen behaviors; naming what should happen removes the guess.",whyOther:"'Gracefully' sounds like the professional, obvious thing to ask for.",reasons:[
 {t:"Spelling out the behavior — show a message, keep the rest going — defines 'gracefully' so they don't have to invent which graceful you meant.",ok:true},
 {t:"'Gracefully' is fine shorthand once a team shares conventions, so the only issue is this team may not yet.",ok:false},
 {t:"The specific version wins because handling each file independently is the correct design anyway.",ok:false},
 {t:"Vague instructions cause back-and-forth, so the detailed one mostly saves round-trips.",ok:false}]},
{sk:'clear',level:1,scenario:"You want the sign-up button changed.",A:"Move the sign-up button above the fold so it shows without scrolling.",B:"Make the sign-up button more prominent on the page.",better:'A',whyBetter:"'More prominent' is yours to picture; 'above the fold' is a place they can act on.",whyOther:"'More prominent' sounds like you're trusting their eye.",reasons:[
 {t:"'Above the fold, visible without scrolling' is one unambiguous place; 'more prominent' could mean bigger, brighter, or moved, and they'll have to guess which.",ok:true},
 {t:"Prominence is subjective, so it's better to let the designer decide what prominent means.",ok:false},
 {t:"The specific instruction wins because placement matters more than styling for sign-ups.",ok:false},
 {t:"Naming the exact spot is mostly about being easy and pleasant to work with.",ok:false}]},
// ---- bug ----
{sk:'bug',level:2,scenario:"A form submits fine for you but fails for a coworker.",A:"Have them send what they typed and what they saw when it failed.",B:"Have them clear their cache and try the form again.",better:'A',whyBetter:"What they did and saw points at the cause; clearing the cache is a guess that hides it if it happens to work.",whyOther:"Clearing the cache often works, so it feels like a quick fix.",reasons:[
 {t:"Their exact input and what they saw shows what's different about their case; clearing the cache might mask the cause and teach you nothing even if it 'works.'",ok:true},
 {t:"Cache problems are common, so clearing it first is just playing the most likely cause.",ok:false},
 {t:"Asking them to clear the cache is less effort for them than describing the failure.",ok:false},
 {t:"You should just reproduce it on your own machine before asking them anything.",ok:false}]},
{sk:'bug',level:2,scenario:"A report shows the wrong total, but only on Mondays.",A:"Look at what the Monday run does that the other days don't.",B:"Recheck the totaling math since the number comes out wrong.",better:'A',whyBetter:"The 'only Mondays' part is the clue; the math is almost certainly fine the other six days.",whyOther:"A wrong total reads like a math mistake, so the math is the obvious place to look.",reasons:[
 {t:"If the math were wrong it would be wrong every day; 'only Mondays' points at something specific to that run, so the difference is the lead.",ok:true},
 {t:"Monday starts the week, so it's probably a date-range issue in how the total is built.",ok:false},
 {t:"Rechecking the math is sensible because totals are where errors usually hide.",ok:false},
 {t:"You should ask whoever reads the report what they mean by 'wrong' first.",ok:false}]},
{sk:'bug',level:3,scenario:"A feature broke after a release that bundled five changes.",A:"Pull the five apart and see which one alone causes it.",B:"Look at the change most likely to be related and fix that.",better:'A',whyBetter:"Isolating one at a time names the cause; a likely-guess can send you fixing an innocent change.",whyOther:"You know the code, so your hunch about the culprit feels reliable.",reasons:[
 {t:"Testing the five changes one at a time shows which actually causes it; the most-likely one can be a coincidence and you'd end up fixing something innocent.",ok:true},
 {t:"Five changes is a lot, so starting with the likely one saves time when your hunch is right.",ok:false},
 {t:"You should roll back the whole release first and then re-add the changes.",ok:false},
 {t:"The likely change is the safest bet because you understand that part of the code best.",ok:false}]},
// ---- ripples (systems) ----
{sk:'ripples',level:2,scenario:"You're switching the date shown to users from US to international format.",A:"Change the display, knowing some exports and reminders still read the old format.",B:"Change the date format everywhere it appears across the app.",better:'A',whyBetter:"A format change ripples into anything that reads the date; the display is safe to change, the readers are not.",whyOther:"One consistent format everywhere sounds cleaner and more correct.",reasons:[
 {t:"Exports, reminders, and anything that parses the date may break if the format under them changes, so the safe move is the display while knowing those readers exist.",ok:true},
 {t:"International format is clearer, so the main thing is just to apply it consistently everywhere.",ok:false},
 {t:"Changing it everywhere is risky only because there's more of it to test.",ok:false},
 {t:"Users get confused by mixed formats, so a partial change is the real problem to avoid.",ok:false}]},
{sk:'ripples',level:3,scenario:"You add a 'remember me' option so people stay logged in for 30 days.",A:"Keep people logged in for 30 days for the convenience.",B:"Keep sessions short so a shared computer can't expose an account.",better:'B',whyBetter:"The convenience helps everyone a little; the open door on shared computers can expose a whole account.",whyOther:"Staying logged in is smoother, and most people use their own devices.",reasons:[
 {t:"Staying logged in is a small convenience per person, but on a shared or public computer it can hand a stranger a live account — a far bigger downside than the time saved.",ok:true},
 {t:"Short sessions are better because security should always win over convenience.",ok:false},
 {t:"Thirty days is simply too long; a week would be the right number.",ok:false},
 {t:"Most people use their own devices, so the convenience is clearly worth it.",ok:false}]},
// ---- first (prioritization) ----
{sk:'first',level:2,scenario:"Launch is Friday. A rare crash and a much-requested small feature both remain.",A:"Fix the rare crash and ship without the feature.",B:"Add the feature and patch the rare crash after launch.",better:'A',whyBetter:"A crash in front of new users costs trust you can't rebuild; a missing small feature disappoints but doesn't break faith.",whyOther:"The crash is rare, and the feature is what people keep asking for.",reasons:[
 {t:"First impressions at launch are fragile: a crash, even a rare one, makes new users distrust the whole product, while a missing small feature is a disappointment they'll forgive.",ok:true},
 {t:"Rare bugs are the hardest to reproduce, so you should fix it now while you can catch it.",ok:false},
 {t:"Features are what drive sign-ups, so shipping it grows the launch more.",ok:false},
 {t:"Bugs should always be fixed before features as a standing rule.",ok:false}]},
{sk:'first',level:2,scenario:"You have one afternoon. One task unblocks two teammates; the other is a feature you're excited about.",A:"Do the task that unblocks the two teammates.",B:"Do the feature you're excited about while the energy is there.",better:'A',whyBetter:"Unblocking two people multiplies — they move while you move; the feature only moves one thing.",whyOther:"Excitement is real fuel, and it fades if you don't use it.",reasons:[
 {t:"The unblocking task frees two others to work in parallel, so the afternoon produces three people's progress instead of one's.",ok:true},
 {t:"Unblocking your teammates is the considerate thing to do, so it should come first.",ok:false},
 {t:"Excitement fades fast, so riding it now is the higher-value move.",ok:false},
 {t:"Whichever task is smaller should go first to clear it off the list.",ok:false}]},
// ---- problem (diagnosis) ----
{sk:'problem',level:2,scenario:"A teammate says 'the API is too slow.'",A:"Ask which specific call is slow and what 'fast enough' would mean.",B:"Start profiling the API to find the slow parts.",better:'A',whyBetter:"'Too slow' names no call and no target, so without them you might optimize the wrong thing toward a bar nobody set.",whyOther:"Profiling is concrete and feels like real progress.",reasons:[
 {t:"'Too slow' points at no specific call and no target, so pinning down which call and what 'fast enough' means keeps you from optimizing the wrong thing toward a standard no one actually set.",ok:true},
 {t:"Profiling is the right first step because it shows you the slow parts directly.",ok:false},
 {t:"APIs are usually slow because of the database, so that's where to start.",ok:false},
 {t:"It's the teammate's complaint, so defining 'slow' should be left to them.",ok:false}]},
{sk:'problem',level:2,scenario:"You're told users are dropping off during sign-up.",A:"Find which step they actually leave on.",B:"Simplify the sign-up form to reduce the drop-off.",better:'A',whyBetter:"'Drop-off' could be one painful step; redesigning the whole form might polish parts that were fine and miss the real one.",whyOther:"Shorter forms are known to convert better, so simplifying feels safe.",reasons:[
 {t:"People may be leaving at one specific step; without knowing which, simplifying the whole form could improve parts that were fine and never touch the step actually losing them.",ok:true},
 {t:"Shorter forms convert better, so simplifying is a safe bet no matter what.",ok:false},
 {t:"Drop-off is usually about asking for too much, so cutting fields is the move.",ok:false},
 {t:"You should run the new form against the old one as a test.",ok:false}]},
{sk:'problem',level:3,scenario:"A user says the app feels 'janky.'",A:"Ask what they were doing the moment it felt janky.",B:"Smooth out the animations, since that's usually what 'janky' means.",better:'A',whyBetter:"'Janky' is a feeling, not a fault; the moment it happened tells you what actually stuttered, which may not be animation at all.",whyOther:"Animation is the usual suspect for jank, so it's a reasonable guess.",reasons:[
 {t:"'Janky' is a vague feeling that could be lag, a layout jump, or a slow tap response; the moment it happened points at the real cause, which may have nothing to do with animation.",ok:true},
 {t:"Animation smoothness is the most common cause of jank, so it's the best first guess.",ok:false},
 {t:"You should gather reports from several users before trusting one person's 'janky.'",ok:false},
 {t:"Jank is subjective, so it isn't worth chasing without hard numbers.",ok:false}]},
];

// free structural tell-gate
const VIRTUE=/\b(check|verify|confirm|make sure|first|before|ensure|careful|double-?check|properly)\b/i;
function tellLeak(it){const la=it.A.length,lb=it.B.length;if(Math.min(la,lb)/Math.max(la,lb)<0.6)return 'length';const va=VIRTUE.test(it.A),vb=VIRTUE.test(it.B);if(va!==vb)return 'virtue';return null;}
const items=JSON.parse(fs.readFileSync(`${DIR}/items.json`,'utf8'));
const norm=s=>s.toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim().slice(0,90);
const have=new Set(items.map(it=>norm(it.scenario)));
let id=items.reduce((m,it)=>Math.max(m,+(String(it.id).replace(/\D/g,''))||0),0);
let add=0,cut=0;
for(const r of R){ if(have.has(norm(r.scenario)))continue; const leak=tellLeak(r); if(leak){cut++;console.log('  CUT(tell:'+leak+')',r.scenario.slice(0,46));continue;} r.id='w'+(++id);r.skill=SKILLS[r.sk];items.push(r);have.add(norm(r.scenario));add++; }
fs.writeFileSync(`${DIR}/items.json`,JSON.stringify(items,null,1));
fs.writeFileSync(`${DIR}/items.js`,'window.ITEMS = '+JSON.stringify(items)+';\nwindow.EXPLOIT = '+JSON.stringify(JSON.parse(fs.readFileSync(`${DIR}/items.js`,'utf8').match(/window\.EXPLOIT = (\[.*?\]);/s)[1]))+';\nwindow.PROFILE = '+JSON.stringify(JSON.parse(fs.readFileSync(`${DIR}/items.js`,'utf8').match(/window\.PROFILE = (\{.*?\});/s)[1]))+';');
const by={}; for(const it of items.filter(i=>!i.contested))by[it.sk]=(by[it.sk]||0)+1;
console.log(`added ${add} weak-spot drills (cut ${cut}) | TRAIN bank now ${items.filter(i=>!i.contested).length} graded across:`,JSON.stringify(by));
