# SPEC.md FORMAT

Single file. Project root. Every cavekit command reads it.

## SECTIONS

Fixed order. Fixed headers. Addressable.

```
# SPEC

## §G GOAL
one line. what code must do.

## §C CONSTRAINTS
- bullet. non-negotiable boundary.
- bullet. tech/lang/lib locked in.

## §I INTERFACES
external surface. what world sees.
- cmd: `foo bar` → stdout JSON
- api: POST /x → 200 {id}
- file: `config.yaml` schema …
- env: `FOO_KEY` required

## §V INVARIANTS
numbered. testable. each ! MUST hold.
V1: ∀ req → auth check before handler
V2: token expiry ≤ ⊥ allowed
V3: DB write ! in transaction

## §T TASKS
pipe table. ids monotonic (never reused). status: `x` done / `~` wip / `.` todo.
id|status|task|cites
T1|.|scaffold repo|-
T2|.|impl §I.api POST /x|V2
T3|x|add §V.1 middleware|V1,I.api

## §B BUGS
pipe table. backprop log. each row = bug + invariant that catches recurrence.
id|date|cause|fix
B1|2026-04-20|token `<` not `≤`|V2
B2|2026-04-21|race on write|V3
```

## ADDRESSING

`§<S>.<n>` = section.item. `§V.2` = invariants section, item 2.

## CAVEMAN ENCODING

Default for every section. Drop articles/filler. Fragments fine. Symbols preferred.

**Preserve verbatim**: code, paths, identifiers, URLs, numbers, error strings.

## ONE FILE RULE

Big project → more sections, not more files. If >500 lines, compact §B (drop oldest).

## WRITES

| command | section |
|---|---|
| spec new | all |
| spec amend | chosen |
| spec bug | §B + §V |
| build | §T status `.`→`~`→`x` |
| check | read only |