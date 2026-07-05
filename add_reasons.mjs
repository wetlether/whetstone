// Add close-cut "why" reason sets (1 exact + 3 near-misses, all scenario-specific, low variance) to graded items.
import fs from 'fs';
const DIR='C:/Users/Adam/whetstone';
const R={
 w1:[
  {t:"What they saw on the screen is the symptom itself — it tells you which failure actually happened, so you aren't guessing at a cause before you even know what broke.",ok:true},
  {t:"Device and browser only matter once you know the failure repeats across different setups, so asking that first just collects detail you can't use yet.",ok:false},
  {t:"Most checkout failures look the same regardless of device, so the device answer would rarely change what you do next anyway.",ok:false},
  {t:"You only get one question, so you should spend it on the thing that would be hardest for you to find out on your own later.",ok:false},
 ],
 w2:[
  {t:"Describing what it currently does wrong points at the cause, so they can fix the real problem; describing the look you want hands them one fix that might patch a symptom and miss why it's wrong.",ok:true},
  {t:"Stating the look you want is fine later, but on its own it skips the step where you both first agree on what is actually broken.",ok:false},
  {t:"Your preferred look is just your taste, and they may have better taste, so leading with the problem respects their design judgment.",ok:false},
  {t:"A described look is harder to build than a described problem, so naming the problem keeps the request lighter for them.",ok:false},
 ],
 w5:[
  {t:"'Bigger and blue' is one exact picture you both share, while 'stand out more' is a different button in their head than in yours — so the vague version invites a wrong guess.",ok:true},
  {t:"'Stand out more' gives them room to invent, and the danger is they'll over-design it instead of making the small change you actually wanted.",ok:false},
  {t:"Specific instructions are faster to act on, so 'bigger and blue' mainly saves them the time of deciding what standing out should mean.",ok:false},
  {t:"'Stand out more' states a goal and 'bigger and blue' states a method, and the goal is the part you should keep control of.",ok:false},
 ],
 w9:[
  {t:"The data corruption hits everyone and can't be undone, while the customer is loud but recoverable tomorrow — so the one slot goes to the harm that's both widespread and permanent.",ok:true},
  {t:"A furious customer is still only one person, so the headcount math favors the bug touching your whole user base no matter how angry that one user is.",ok:false},
  {t:"Silent problems are more dangerous than loud ones exactly because nobody is watching them, so the quiet bug should always win.",ok:false},
  {t:"The angry customer can be calmed with an apology while the data bug needs real work, so you tackle the harder job first.",ok:false},
 ],
 w18:[
  {t:"Shrinking treats 'tabs that don't fit' as the problem, but the real question is whether it needs tabs at all — reframing the goal makes the fitting problem disappear instead of fighting it.",ok:true},
  {t:"Tiny tabs are hard to tap with a thumb, so a scrolling list wins mainly because it's easier to actually use on a phone.",ok:false},
  {t:"Tabs generally don't belong on small screens, so dropping them is just the standard right answer for mobile.",ok:false},
  {t:"Shrinking the tabs is more fiddly to build than a plain list, so the list wins because it's the simpler thing to make.",ok:false},
 ],
 w19:[
  {t:"When people keep using something a way you didn't plan, that pattern is data about what they actually want — so the 'misuse' may be pointing at a better product than the one you intended.",ok:true},
  {t:"Blocking the behavior will frustrate the users who found it useful, so it's kinder to leave them alone than to police them.",ok:false},
  {t:"Users generally understand a product better than its makers do, so you should defer to how they use it rather than impose rules.",ok:false},
  {t:"Writing rules to stop misuse is endless because people keep finding workarounds, so it isn't worth the effort to fight it.",ok:false},
 ],
 w20:[
  {t:"Quality is whether someone can use it without stopping to think; a design that impresses but makes people pause to figure it out has failed the only test that matters.",ok:true},
  {t:"First-time users matter most, so the design a stranger can use wins because new users are the ones you're trying to win over.",ok:false},
  {t:"Flashy designs tend to go out of style faster, so the plain, usable one is the safer long-term bet.",ok:false},
  {t:"Impressive visuals usually slow an app down, so the simpler design is the better choice for performance.",ok:false},
 ],
};
const items=JSON.parse(fs.readFileSync(`${DIR}/items.json`,'utf8'));
let n=0;
for(const it of items){ if(R[it.id]){ it.reasons=R[it.id]; n++; } }
fs.writeFileSync(`${DIR}/items.json`,JSON.stringify(items,null,1));
fs.writeFileSync(`${DIR}/items.js`,'window.ITEMS = '+JSON.stringify(items)+';');
console.log(`added close-cut reason sets to ${n} graded items.`);
