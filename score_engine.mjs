// Whetstone box-side grading — runs INSIDE the user's Wetlether box, on the box's own Claude.
// The box passes its existing model-call as `callClaude` (so this stays decoupled from box internals,
// uses the user's own model = private + no external paid API). Returns per-axis scores; the score.html
// page places them on the baked field baseline.
//
// INSTALL (box Claude): add a route, e.g.
//   app.post('/score', bearerGate, async (req,res) => {
//     const out = await gradeSession(req.body.text || req.body.turns, askClaude);
//     res.json(out);                       // -> { scores:{...}, evidence:{...} }
//   });
// where askClaude(systemPrompt, userPrompt) -> string is however the box already calls Claude.
// Then serve score.html with:  window.SCORE_ENDPOINT = '/score'  (same-origin, behind the box bearer).

export const AXES = ['diagnosis','intuition','logic','clarity','decisiveness','prioritization','debugging','systems','skepticism','overall'];

// Pull the developer's OWN turns out of a pasted chat. Drops obvious assistant/tool/system lines.
// If the text has no role markers, treat each non-empty block as one of their turns.
export function extractTurns(input) {
  if (Array.isArray(input)) return input.filter(t => typeof t === 'string' && t.trim().length > 3);
  const text = String(input || '');
  const lines = text.split(/\r?\n/);
  const ASSIST = /^\s*(assistant|claude|ai|bot|gpt|system|tool|>|\[|```)/i;
  const USER = /^\s*(you|user|me|adam|human)\s*[:>-]/i;
  const turns = []; let cur = [];
  const flush = () => { const s = cur.join(' ').trim(); if (s.length > 3) turns.push(s); cur = []; };
  let sawRole = false;
  for (const ln of lines) {
    if (USER.test(ln)) { sawRole = true; flush(); cur.push(ln.replace(USER, '').trim()); }
    else if (ASSIST.test(ln)) { sawRole = true; flush(); /* skip assistant block until next USER */ while (false); }
    else if (ln.trim()) cur.push(ln.trim());
    else flush();
  }
  flush();
  // if there were no role markers at all, the whole paste is "their turns" split by blank lines
  return turns.filter(Boolean).slice(0, 60);
}

export function buildGradingPrompt(turns) {
  const numbered = turns.map((t, i) => `${i + 1}. ${t}`).join('\n');
  const sys = `You are a strict, fair senior engineer scoring a developer's JUDGMENT from the messages they sent to an AI coding assistant. Score the HUMAN's thinking — how they direct, diagnose, and decide — NOT the assistant and NOT raw syntax. Be blind to who they are. Use the FULL 1-10 range; most real developers sit 4-7, reserve 8-10 for genuinely excellent, 1-3 for clearly poor. Do not be generous; a flattering score is useless to them.
Axes:
- diagnosis: names the real problem vs a surface symptom
- intuition: instinct for the right approach, irrespective of language/training
- logic: soundness and explicitness of reasoning
- clarity: how precisely and self-containedly they ask for what they want
- decisiveness: gives actionable, unambiguous direction
- prioritization: focuses on what matters most first
- debugging: isolates faults on purpose vs guessing
- systems: sees cross-cutting / downstream impact
- skepticism: verifies and pushes back vs assumes
- overall: overall quality as a coding director
Output ONLY JSON: {"diagnosis":n,...,"overall":n,"evidence":{"strongest":"<axis> — one short reason","weakest":"<axis> — one short reason"}}`;
  const user = `Here are the developer's messages (${turns.length}). Judge the body of work as a whole.\n\n${numbered}`;
  return { sys, user };
}

export function parseScores(raw) {
  const m = String(raw).match(/\{[\s\S]*\}/); if (!m) return null;
  let o; try { o = JSON.parse(m[0]); } catch { return null; }
  const scores = {};
  for (const ax of AXES) { const v = Number(o[ax]); if (!(v >= 1 && v <= 10)) return null; scores[ax] = v; }
  return { scores, evidence: o.evidence || {} };
}

// Orchestrator. callClaude(sys, user) -> string (the box's own Claude call).
export async function gradeSession(input, callClaude) {
  const turns = extractTurns(input);
  if (turns.length < 3) return { error: 'need at least a few of your own messages to score', turns: turns.length };
  const { sys, user } = buildGradingPrompt(turns);
  let parsed = null;
  for (let i = 0; i < 3 && !parsed; i++) { try { parsed = parseScores(await callClaude(sys, user)); } catch {} }
  if (!parsed) return { error: 'grading failed; try again' };
  return { scores: parsed.scores, evidence: parsed.evidence, turns: turns.length };
}

// The frozen field baseline (same numbers baked into score_data.js) — exported so the box can
// return percentiles too if it prefers server-side placement.
export const BASELINE = {"diagnosis":{"mean":5.36,"sd":1.25},"intuition":{"mean":5.51,"sd":1.07},"logic":{"mean":5.32,"sd":1.14},"clarity":{"mean":5.43,"sd":1.18},"decisiveness":{"mean":5.26,"sd":1.18},"prioritization":{"mean":5.35,"sd":1.08},"debugging":{"mean":4.43,"sd":1.23},"systems":{"mean":4.83,"sd":1.18},"skepticism":{"mean":4.75,"sd":1.23},"overall":{"mean":5.25,"sd":1.11}};
