---
name: cavekit-check
description: "Read-only drift detector. Diffs SPEC.md vs code, reports violations. Zero writes. Triggers: check drift, audit spec."
---

# cavekit-check — drift report

Pure diagnostic. Reports violations. User decides remedy.

## LOAD

1. Read `SPEC.md`. Missing → "no spec, nothing to check." Stop.
2. Parse args: `§V` (default), `§I`, `§T`, `--all`

## CHECK §V — invariants

For each V<n>:
1. Translate invariant into verifiable claim
2. Grep/read relevant files
3. Classify: **HOLD** / **VIOLATE** / **UNVERIFIABLE**
4. Record address + file:line

## CHECK §I — interfaces

For each I item:
1. Locate implementation
2. **MATCH** / **DRIFT** / **MISSING** / **EXTRA**

## CHECK §T — tasks

For each T<n>:
1. `x` → verify work present
2. `~` → in-progress
3. `.` → pending
4. Flag `x` with no evidence as **STALE**

## REPORT

Caveman. Grouped by severity.

```
## §V drift
V2 VIOLATE: auth/mw.go:47 uses `<` not `≤`. see §B.1.
V5 UNVERIFIABLE: no test covers ∀ req path.

## §I drift
I.api DRIFT: POST /x returns `{result}` not `{id}`.

## §T drift
T3 STALE: status `x`, no middleware file exists.

## summary
2 violate. 1 missing. 1 stale. 1 unverifiable.
next: spec skill `bug:` or fix code.
```

## REMEDY HINTS (not actions)

- VIOLATE/DRIFT → spec skill `bug: <V.n>` or fix code
- MISSING → build skill on `§T.n` if task exists; else spec skill `amend §T`
- STALE → spec skill `amend §T` to uncheck
- EXTRA → spec skill `amend §I` to document, or delete code

Never invoke fixes. Report only.

## NON-GOALS

Zero writes. No sub-agents. No scores/grades.