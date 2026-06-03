---
name: cavekit-spec
description: "SPEC.md mutator. Create/amend/backprop bugs into SPEC.md. Triggers: write spec, new spec, distill, bug, amend."
---

# cavekit-spec — spec mutator

Read `FORMAT.md` if not loaded. Caveman encoding for all writes.

## DISPATCH

1. No `SPEC.md` + idea → **NEW**
2. No `SPEC.md` + `from-code` → **DISTILL**
3. `SPEC.md` + `bug:` → **BACKPROP**
4. `SPEC.md` + `amend` → **AMEND**
5. `SPEC.md` + no args → ask user mode

## NEW — idea → spec

Steps:
1. Extract goal (1 line, caveman) → §G
2. List constraints → §C
3. List external surfaces → §I
4. Propose invariants → §V (V1, V2…)
5. Break into ordered tasks → §T pipe table, status `.`, ids T1…
6. §B with header row only

Write `SPEC.md`. Show user. Ask: "spec OK? suggest edits or /build."

## DISTILL — code → spec

Walk repo. §G from README/package.json, §C from stack, §I from APIs/CLIs/configs, §V from tests, §T from TODOs, §B empty. Flag uncertain items with `?`.

## BACKPROP — bug → §B + §V

1. Parse bug, find root cause
2. Would new invariant catch recurrence? If yes → draft `V<next>`
3. Append §B row: `B<next>|<date>|<cause>|V<N>`
4. Append new §V line
5. If behavior changes → update §T
6. Show diff. Apply on user OK

Rule: every bug gets §B. Invariant optional but preferred.

## AMEND

Read section. Show current. Ask user changes. Write. Show diff. Never silently rewrite unnamed sections.

## OUTPUT RULES

- Caveman format. Preserve identifiers, paths, code verbatim.
- Numbering monotonic — never reuse §V.N or §B.N.
- §T `cites` column: `T5|.|impl auth mw|V2,I.api`

## NON-GOALS

No sub-agents. No dashboards. No auto-build after spec.