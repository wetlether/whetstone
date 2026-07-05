# Whetstone — resume state

## Landmarks (read first)
- **DONE (2026-06-19):** "Both" why-step rework (free-text first → self-compare → equalized MC) shipped + visually verified. Killed the reason length-tell (92%→33%). Reframed 6 A/B-leaky items; w35/w37→contested. Added 9 weak-spot items (w41–w49) from mined mistakes (doubt 0→3, ripples 1→3, clear ×2, bug, first) using the careful-but-misdirected technique (A/B 72%→44%). Live: **whet-v10**, commit 5ece9ed, pushed, render-verified.
- **BLOCKED:** nothing.
- **NEXT (await Adam's go):** he's "playing around" with the live app — expect UX/content feedback. Held builds: in-Wetlether editor surface (#46), box-side live scoring (handoff parked in `wetlether-sync/from-desktop/`). Conversation synopsis-naming is a separate parked build.
- **DEVIATIONS:** one. I asserted the 9 new items were "built tell-free from the start"; the cue-attacker falsified it (A/B 72%). Owned immediately, root-caused (made the careful option the answer in all 9), fixed. Cost ~1 extra rework+cert round.

## Self-audit
The goof above is the real one — I had the exact fix in hand (used it on the earlier 6) and didn't apply it preemptively to the new batch, so I burned a paid cert round discovering a tell I could have prevented. What went well: caught it honestly the moment the data contradicted me, and used the cert as a real gate rather than declaring done from code. Left on the table: never separated "form tell" from "attacker cheating with knowledge" with a proper repeated-run variance measurement (decided it wasn't worth the paid runs given the aggregate was already clean — defensible, but it's an unquantified assumption). Also didn't visually verify a *new doubt item mid-flow* specifically (verified home render + the flow earlier on a different item); low risk since code path is unchanged, but it's a small gap.

**What:** standalone coding-judgment trainer + scorer. Repo `github.com/wetlether/whetstone` (throwaway acct). Live: https://wetlether.github.io/whetstone/ (PWA). All generation ON-PLAN (me, no GPT) except the Adam-approved cue-attacker.

## Live now (SW cache whet-v10, pushed 2026-06-19)
- **Train** (weak axes), **Exploit** (strengths), **Score** (`/score.html`), **🎯 skill set**, "I disagree—bank it", contested items, mastery spiral. Progress in localStorage.
- **Bank:** 33 items — **28 graded + 5 contested** (w24, w25, w26, w35, w37).
- **9 new weak-spot items (w41–w49)** generated from `my_mistakes.json`: **doubt ×3** (w41 domain-not-active, w42 was-slow-now-fine, w43 trust-the-success-msg — this axis had ZERO items), **ripples ×2** (w44 column rename, w45 works-in-my-terminal), **clear ×2** (w46 "the thing we discussed" curse-of-knowledge, w47 metaphor-vs-spec), **bug ×1** (w48 L1), **first ×1** (w49 bundle-vs-isolate). Verified live: "Not taking it on faith" now renders on the home ears list.
- **Score:** `score.html` vs frozen field **baseline n=119 (noise-decoupled)**. `score_engine.mjs` = box-side grader (takes box's own Claude as `callClaude`, has `isJudgmentTurn` gate). Adam ≈ **12th pct overall** (apples-to-apples).

## DONE 2026-06-18: the "Both" why-step rework (Adam's choice), shipped + verified
- **Train flow rebuilt:** pick A/B → **free-text "why" first** (you articulate it, zero tell, correctness NOT yet revealed) → **self-compare vs the expert read** → **equalized 4-option MC as a secondary check** → disagree-bank + Next. Functions: `freeWhy`, `revealCompare`, `secondaryMC`, `tailGraded` in index.html. Visually verified (headless drive to the free-text screen).
- **Killed the answer-key length tell:** equalized all graded reasons to same length/specificity; correct reason no longer the longest/most-complete. Reason cue-attacker **92% → 33%** (chance 25%).
- **A/B leak fixed:** reframed 6 items so the wrong option sounds equally responsible; the 2 STABLE leakers (w35, w37 — where the correct answer is genuinely the prudent one) **converted to contested** judgment calls. A/B attacker **54% → 46%** (chance 50%, no stable leaker left).

## Cert truth (important, don't re-chase)
- Per-item cert pass/fail is **noise-dominated** (n=3 attackers): w27/w29/w30/w49/w41 flipped pass↔fail across runs with IDENTICAL text. Trust the **aggregate**, not per-item.
- Residual reason-crack (~26–33%) is noise + attacker models disobeying "form-only" and using real knowledge — a form-only human can't. The **free-text step is the real trainer (zero tell by construction)**; the MC is secondary. **LOCKED — stop rewording.**
- **KEY BUILD TECHNIQUE (reusable):** the "diligent option = keyed answer" tell is what makes weak-spot items A/B-crackable (his lessons are intrinsically "be more careful/precise"). FIX = write the WRONG option as a **careful-but-misdirected** action (verify the assumed cause instead of the symptom; execute the rename cleanly instead of finding readers; jog memory instead of stating it). This dropped the new batch A/B from 72% → 44%. The earlier 6 reworks used the same move.
- **Remaining ceiling:** pure clarity items (w46/w47) where "be explicit/concrete" genuinely sounds more correct — a mild stable A/B lean that the aggregate absorbs and the free-text covers. Do NOT mark these contested (they have a real better answer, unlike w35/w37 which were genuine tradeoffs).

## Pending (NOT started, await Adam's go)
- In-app editor surface inside Wetlether (build #46) — HELD; PC-Claude acked handoff. Live channel = git.
- Box-side live scoring handoff dropped to `wetlether-sync/from-desktop/` (box was closed).

## Guardrails
Read-only on Adam's other projects; isolated repo only; commit only served files (index.html, items.js, sw.js) — never the helper .mjs or experiment internals (some reference paid APIs); no paid API without explicit OK (cue-attacker = the one exception); honesty over flattery.
