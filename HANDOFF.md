# HANDOFF — Breakbones-hall-of-meat

**Last updated: 2026-11-22 (America/New_York).**
**Repo:** `mhvnsnt/Breakbones-hall-of-meat` (PUBLIC), default branch `main`.
**Purpose of this file:** any agent that picks up work here reads this FIRST, then the linked docs. It states what we've done, where we're at, and what we're working toward — so the owner can say "go to this repo, pick up the work" and you just know. Update this file in the same PR whenever the state changes (add, don't delete).

## 1. What this repo is

"Hall of Meat" game — a small web game (Vite + TypeScript, `src/`, `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`, `metadata.json`). The repo description is "Hall of meat game". It was initialized 2026-10-26 (commit `28e5480`, then `feat: initialize Breakbones project`, commit `49034fb`).

There is NO root README — pickup starts at `WORKING-METHOD.md`. What "Hall of Meat" plays like, what its goal is, or what the next feature is, is NOT written down in the repo state read 2026-11-22. "Breakbones" is the name attached to the project; treat the game design as unclear until the owner or the code says otherwise.

## 2. Where we're at

### DONE
- **Project initialized (2026-10-26):** initial commit + Breakbones project scaffold — Vite + TS app structure in place.
- **Working method stated (2026-10-27, commit `2e5a9a8`):** `WORKING-METHOD.md` at root.
- **Last push 2026-11-20** (repo metadata; no new content commits after Oct 27 — the push reflects repo-level activity).

### IN PROGRESS
- **Two open docs PRs (Nov 19–20, unmerged):** PR #2 — "Docs: pre-made parts first rule" (`docs/premade-parts-first`, 2026-11-20); PR #1 — "Docs: sourcing rule" (`docs/sourcing-rule`, 2026-11-19). Next step: a merge call on #1 and #2.
- **No gameplay, slice, or design is recorded in the repo.** The scaffold exists; the game does not yet, as far as the repo state shows.

### BLOCKED
- **Nothing recorded as blocked in the repo state read 2026-11-22.** No blocked item is named in this repo. The open PRs are awaiting a merge decision, not unblocked work. The missing game design is an open question (see §6), not a technical block.

## 3. What we're working toward

**The goal (as far as the repo states it):** ship "Hall of Meat" as a playable web game from this scaffold.

**The bar (owner, general):** REAL-SOURCE-ONLY — real parts, wired in, no hand-tooled lookalikes; the work proves itself in a live playable build the owner can open on his phone, never a text-only "done". Until the game is defined, there is no specific bar for this repo beyond that.

**In order:** (1) merge or close PRs #1 and #2; (2) get the owner to define what Hall of Meat is and what the first playable slice is; (3) build that slice in player-progression order.

## 4. Standing rules that apply here

- **Branch → PR → merge, always.** Never push to main directly. Add-only, zero-conflict PRs, no force pushes.
- **Checkpoint-and-save law:** CHECKPOINT.md first, update after every step; the repo is the save; resume, never restart.
- **No-temp-storage law:** nothing in /tmp or any wipeable location, ever. Everything goes straight into the repo or a durable folder the second it exists.
- **Real-source-only:** every part comes from the actual source code and files, wired up fully. No hand-tooled lookalikes, no fake panels.
- **No-gaps / solve-it law:** a gap or block is never the end of the work — route-switch until it's done or every reasonable route is exhausted with exact errors recorded.
- **Never kill in-progress work.** Never delete another lane's work without the standing verification rules.
- **Phone-only:** the owner works from his phone — anything built here must be openable and playable from a phone link, no manual setup steps for him.

## 5. Key files and paths

| What | Where |
|---|---|
| App entry | `index.html`, `src/` |
| Build config | `vite.config.ts`, `tsconfig.json`, `package.json`, `bun.lock` |
| App metadata | `metadata.json` |
| Working method (start here — no README) | `WORKING-METHOD.md` |
| Env example | `.env.example` |
| Open PRs | #1 (sourcing rule), #2 (pre-made parts first rule) |

There is no root README and no releases in this repo.

## 6. Open decisions needing the owner

- **Merge PRs #1 and #2?** Two small docs-rule PRs open since Nov 19–20. Merging locks the rules in; leaving them open leaves the repo without the written rules. His call — lanes do not decide merges.
- **What IS Hall of Meat?** The name is the only game fact in the repo. What it plays like, what the first playable slice is, and what comes first — all his call. A lane cannot invent the game design.
- **No other owner decision is recorded as open in this repo's state.**

## 7. How to pick up

1. Read this HANDOFF.md first, then `WORKING-METHOD.md` and `src/` (there is no README).
2. Check the two open PRs (#1, #2) — leave them alone unless told to merge.
3. Do NOT invent a game design for Hall of Meat. If the design is still undefined, the next step is asking the owner (through the parent agent), not building a guessed game.
4. If a design lands, build the first playable slice in player-progression order, branch → PR → merge, and stage it so it opens on his phone.
5. Resume from the stated next step — never restart, never re-derive finished work.
6. Land work branch → PR → merge, add-only. Update this HANDOFF.md in the same PR when the state changes. Verify with your own eyes (live playable build) before claiming anything done.
