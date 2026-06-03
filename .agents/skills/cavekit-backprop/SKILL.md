---
name: cavekit-backprop
description: "Bug to spec protocol. Trace cause on test failure, decide if new invariant prevents recurrence, append to B. Triggers: test fail, bug report."
---

# cavekit-backprop — bug → spec

Plan-then-execute fixes the code & forgets. SDD fixes code AND edits spec so recurrence is impossible. That edit is backprop.

## WHEN TO BACKPROP

- Test fails at build verification
- User reports bug
- Post-mortem after incident
- Check flags VIOLATE with root cause found

## SIX STEPS

### 1. TRACE
Read failure output / bug report. Find exact file:line of wrong behavior. Name root cause in one caveman sentence.

### 2. ANALYZE
Ask three questions:
- Would new §V catch this bug class? (most common: yes)
- Is §I wrong — spec claims shape code can't deliver?
- Is §T wrong — built wrong thing?

### 3. PROPOSE
Draft spec change. Never skip §B. §V/§I/§T case-by-case.

Template:
```
§B row: B<next>|<date>|<root cause>|V<N>
§V line: V<next>: <testable rule that would have caught it>
```

### 4. GENERATE TEST
New invariant without test = lie. Add failing test first. Name test citing invariant: `TestV7_RefundIdempotent`.

### 5. VERIFY
Fix code. Run test. Must pass. Full suite. No regressions.

### 6. LOG
Commit spec edit + test + code fix together.
Msg: `backprop §B.<n> + §V.<N>: <one-line cause>`

## WHAT MAKES GOOD INVARIANT

- Testable in code (grep-able or assert-able)
- Scoped to behavior, not file
- Stated positively: `! hold` over `⊥ forbid`
- References §I surface

**Bad**: V8: code should be correct.
**Good**: V8: ∀ pg_query ! params via driver, ⊥ string concat.

## WHEN NOT TO ADD §V

- Mechanical typo, no class (i++ vs i--)
- One-time migration
- External dep (note in §C)

Still append §B. Future bug with same smell → §B search shows precedent.

## OUTPUT

Every backprop: §B entry (always) + §V entry (usually) + test + code fix + one commit.