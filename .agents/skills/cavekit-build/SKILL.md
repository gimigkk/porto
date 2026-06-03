---
name: cavekit-build
description: "Plan-then-execute against SPEC.md. Single-thread loop. On failure auto-backprops. Triggers: build spec, implement task."
---

# cavekit-build — implement spec

Single-thread. No swarm.

## LOAD

1. Read `SPEC.md`. Missing → tell user run spec skill first. Stop.
2. Parse args:
   - `§T.n` → that task only
   - `--next` → lowest `.` or `~` row
   - `--all` or empty → all `.` rows in §T order

## PLAN

For chosen task(s):

1. Cite every §V invariant that applies. Plan must respect all.
2. Cite every §I interface touched. Plan must preserve shape.
3. List files to create/edit.
4. List tests to add/update (one per invariant touched).
5. Name verification command (test, build, lint).

Show plan. Wait for user OK.

## EXECUTE

Per task in order:

1. Flip §T.n status `.` → `~`
2. Edit code per plan
3. Run verification
4. **Pass** → flip `~` → `x`. Next task.
5. **Fail** → invoke backprop. Do NOT retry blindly.

## FAIL → BACKPROP

1. Read failure output
2. Ask: (a) code bug? (b) spec wrong? (c) edge case?
3. If (a) → fix code, re-run. No spec change.
4. If (b)/(c) → run spec skill `bug: <cause>` first, update §V+§B, then resume build.

Rule: never silently fix root-cause without considering backprop.

## WRITE POLICY

- Only flip §T status. Other spec edits → spec skill.
- Commit after each §T: `T<n>: <goal line>` + §V cites.

## VERIFICATION

Task `x` only if:
- Verification exits 0
- New test(s) added per plan
- No §V regressed (run full suite)

## NON-GOALS

No sub-agents. No parallel. No dashboards. No speculative work beyond task scope.