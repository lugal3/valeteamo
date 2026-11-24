# ValeTeAmo V2 — Game Feel & World Polish

**Base:** `main` at `fbd78676715bff090283140d34bf55725b41072a`  
**Integration branch:** `feature/valeteamo-v2-game-feel-integral`  
**Release policy:** No merging into `main` and no Firebase production deploy until all phases, regression checks, and user approval. Classic 2D `Corazones` must remain untouched.

## Working agreement

Each numbered phase is a **complete vertical slice** (implementation + animation/UI/audio integration + automated regression + manual/browser evidence). Commit each phase separately to this same branch, update this file, keep existing systems instead of replacing them, and do **not** create a parallel implementation. There is no promise of a background run: phases are implemented in active work sessions. Merge only at the end.

**Non-negotiable:** Preserve the custom WebGL1 house renderer; Phaser 2D, legacy `Corazones`, the intro through the front window, Louis and Emy rigs, RC/signal/noise, world physics, saves/checkpoints, the two existing endings, and mobile-first performance. No forced teleports or invisible geometry hacks.

## Progress

| Phase | Workstream | Status | Main acceptance gate |
|---|---|---|---|
| 01 | **Emy + hides / unfair failures** | **DONE — QA passed** | Kitty hides independently of cat arrival; Emy distracts on another floor and waits silently if Kitty stays hidden; no lost life from a cat wait |
| 02 | **Kitty movement, physics, camera** | **IMPLEMENTED — browser QA pending** | Grounded acceleration/deceleration, turn/crouch transitions, robust stairs, camera collisions/comfort and mobile input |
| 03 | **Pursuer perception + fair stealth AI** | NOT STARTED | Separate sight/hearing/suspicion/chase/search states, last-seen positions, visible-door logic and unbiased hide searching |
| 04 | **Emy's autonomous personality** | NOT STARTED | Sit, groom, stretch, orient ears to noise, cautious follow, “Quédate aquí”, safe hold, consistent cross-floor routing |
| 05 | **House environmental life** | NOT STARTED | Identity of every room, small ambient props, lighting, wind/dust, performant atmosphere without clutter |
| 06 | **Throwable objects + sound/material physics** | NOT STARTED | Glass/ceramic/metal/wood/carpet responses, controlled throw strengths, predictable collisions, noise investigation |
| 07 | **RC controls, camera, and strategy** | NOT STARTED | Smoother drive and camera; suspension/bumps, legible tablet HUD, horn, combined RC/Emy tactics |
| 08 | **2D flow, storytelling and 2D→3D transition** | NOT STARTED | Kawaii day→night pacing, credible meeting/kidnap, no pop-ins, coherent front window, seamless house handoff |
| 09 | **Louis, puzzles and progression** | NOT STARTED | Natural rescue/companion animations, verified cover and body rig, contextual dialogue, progressive puzzle hints/checkpoints |
| 10 | **Cinematics, endings and reactive audio** | NOT STARTED | Understandable Emy-rescue and escape/loss cutscenes, synchronized spatial audio, proper camera framing on PC/iPhone |
| 11 | **HUD, tutorials, accessibility and mobile feel** | NOT STARTED | Clean contextual controls, phone/hotbar, orientation/safe areas, motion/audio/text options |
| 12 | **Optimization, playthrough QA and release** | NOT STARTED | Full automated/manual end-to-end test matrix, capture evidence, compare baselines, PR review, then merge and deploy |

### Phase details & completion criteria

#### 01 — Kitty safety and Emy independence
- Remove coupling in `house.js/updateHiding` that repeatedly restarts a seven-second grace period when Emy moves.
- Kitty enters the wardrobe in the existing player animation time even if Emy is downstairs, chasing a decoy, returning, or stuck.
- When Emy is nearby, keep her optional physical closet animation but never hold Kitty's entrance.
- While Kitty is hidden, an Emy distraction keeps its **25-second** noise cycle and its pursuer investigation priority. When finished, she stays quietly in place until Kitty emerges rather than walking loudly toward the wardrobe.
- When Emy is far away and Kitty hides, she waits safely instead of hiking cross-floor to the hiding spot. When Kitty emerges, resume normal pathfinding, no teleport.
- Tests: far floor, close wardrobe, remote distraction, distraction finishes while hidden, unhide/rejoin, save compatibility.

#### 02 — Movement and camera
- Smooth speed transitions on stick/keyboard; locomotion and first-person hand timing, crouch and obstacle response.
- Prevent door-frame and stair clamping/teleport artifacts; smooth camera yaw/pitch and optional reduced bob.
- Verify touch+mouse+keyboard in the same state machine; maintain predictable turning with consistent FOV and sensitivity.
- Tests: collisions at stairs, locked door, hidden and camera reset; quality-low performance.

#### 03 — Pursuer AI
- True suspicion vs investigation vs confirmed line-of-sight chase; start alert on confirmed sighting.
- Retain last visible location and search locally, not player coordinates through obstacles; respect audio occlusion and floor.
- Wardrobe searching only if evidence (saw Kitty enter / strong noise), not an automatic penalty; RC and Emy noise precedence explicitly documented.
- Tests: corner escape, wardrobe unseen/seen, remote sound, distraction, multi-floor patrol.

#### 04 — Emy as companion
- Additional “Quédate aquí” command; return/release, patience and optional cautious routes.
- Rig-only behavioral idles (blink, stretch, groom, ear reactions) with a bounded animation budget.
- Maintain one authority per mode: distract, fetch, hide, hold, follow, rescue; no double-driven transform.
- Test multiple floor changes, obstructions, story events, reduced motion and saves.

#### 05 — Environmental storytelling
- Room-specific silhouettes and props (kitchen, study, bath, upper hall, bedroom), sparse reactive detail and safe collision volumes.
- Animated curtains/clock/lamp flicker/dust within WebGL1 and mobile budgets; distinguish clue props from ambience.
- Test no occlusion of puzzle interactions and house navigation.

#### 06 — Objects and materials
- Physical interactions distinguish glass, ceramic, metal, wood and soft surfaces; optional glass break is audiovisual only unless authored cleanup.
- Pick-up/aim/throw/put-down cues with strength bounded by accessibility controls; deterministic collision and AI noise.
- Tests: collisions, Emy dodge, pursuer stun and FPS bounds.

#### 07 — RC
- Smooth camera/controls, horn, light hints and wheel/suspension reactions.
- Tablet HUD legibility, RC state and recoverability, clear AI distraction feedback; Emy and RC combination without overriding Kitty.
- Tests: RC basement/stairs, trap, recovery, chase precedence, mobile.

#### 08 — Prologue
- Strengthen escalation from day to night; character schedules, coherent scream/rescue and van scene.
- Avoid instant NPC/enemy pop-in; ensure clues, waypoints and front window remain accessible and map-aligned.
- Test heart→2D, intro, Churu, Louis, van LUNA-07, 2D→3D handoff and classic 2D preservation.

#### 09 — Louis/puzzles
- Natural fear/idle/cover reactions with clean limbs/ears/neckline; safe under-bar pose and rig geometry budget.
- Progressive glow hints tied to actual drawer, screwdriver, vents, notes and discovered clues; checkpoint-safe puzzle state.
- Tests: complete puzzles, hidden model, three rig perspectives and story saves.

#### 10 — Audio/cinematics
- Distinct clear shots: discovery, Emy rescue, Louis escapes; no actor hidden behind a facade or lens.
- Spatial footfalls, floors/doors and dynamic but sparse tension; captions and ducking priority.
- Test both endings and one-time bonus save reload; audio disabled/low-power.

#### 11 — UI/UX
- Consolidate noisy controls and keep the pink phone/hotbar style; larger touch targets on landscape iPhone.
- Accessibility: motion-reduction, text sizes, contrast, interaction indicator intensity and audio mix.
- Test portrait handling, focus, mouse/touch, pause/return and no overlapping layers.

#### 12 — Final QA / release
- `npm ci`, `npm test`, `npm run test:perf`, `npm run build`, `npm run test:browser` (as available), browser Chromium mobile/desktop and WebKit.
- Full run beginning in cosmos, entering 2D, finding Louis, kidnapping, front-window 3D, rescuing Louis, RC, both endings, 0→Emy extra life, and all hiding modes.
- Screenshot/video evidence of key visual sequences and CPU/GPU budget; audit checkpoint compatibility and no changes to classic `Corazones`.
- On green tests plus final review: merge this PR into `main`, verify Firebase live deployment. Do not declare unexecuted checks successful.

## Current baseline issue (Phase 01)

`house.js/updateHiding` waits on Emy movement while entering wardrobe. Since `catMovedAt` is reset whenever Emy moves by over 8 cm, the player camera can be locked open indefinitely while Emy crosses floors. Fix by removing the **dependency entirely**, not by merely lowering the timeout.

## Phase 01 implementation & verification (completed)

- Removed the player-facing wardrobe wait on Emy travel, without changing hide collision or classic animation timing.
- Companion's remote `hold` state is silent and transient, allowing an active 25s distraction to finish on a different floor; rejoins when Kitty emerges.
- `tests/emy-hide-independence.cjs` verifies two-floor hiding, hiding independent of arrival, full distraction, no cat warp, and save/load compatibility.
- [CI](https://github.com/lugal3/valeteamo/actions/runs/45424926734): green full emy-abilities suite (general + perf + build + Chromium mobile/desktop, WebKit, threat/hide regression). Cosmos E2E browser has a separate pre-existing unresolved failure; track at Phase 08/12.

## Phase 02 code changes

- `src/lab/locomotion-feel.js`: analogue move intent with separate acceleration/braking/reversal, normalized diagonals, smooth sprint/crouch speeds, small touch deadzone, pre-stair speed cap, visual-only floor smoothing and frame-rate-independent crouch height.
- `src/lab/house.js`: integrate into existing world navigator; keep player collider grounded immediately, separate visual camera floor from collision physics; sync visual floor on intro, save reload and trial teleport; brake quickly after key/touch release; easier touch sprint activation with hysteresis.
- `src/lab/camera-controls.js`: shortest-path yaw between equivalent ±π positions, preserving desktop pointer settings and existing pitch behavior.
- `tests/locomotion-feel.cjs`: 30/60/120Hz comparison, diagonal cap, reversal, stopping, sprint blend, touch drift, camera angle seams, crouch and real two-way stair collisions.
- `tests/emy-abilities-browser.cjs`: PC/mobile keyboard movement, braking, upstairs view alignment, and phone touch joystick + sprint-release regression across browsers.
- Existing navigation/collision geometry and scripted cinematics are unchanged. No 2D content touched in this phase.
- **Gate:** baseline unit/perf/build passed in [CI](https://github.com/lugal3/valeteamo/actions/runs/45427579689); final browser extension under [CI](https://github.com/lugal3/valeteamo/actions/runs/45428020726), not yet confirmed green. Do not label the phase fully validated until this finishes.
