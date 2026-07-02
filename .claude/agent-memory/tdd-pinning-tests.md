# Precedence features yield green-on-arrival pinning tests — name them as such

**Date:** 2026-07-02 · **Class:** Process (TDD discipline)

When a feature is a *precedence contract* over an existing evaluation path
(e.g. PLN-2's master switch > deny > allow > rollout in the flag engine), only
the first slice per branch of new behaviour goes genuinely red; the remaining
specs arrive green because the minimal implementation already fixed the
ordering. The same happens for composition specs a plan predicts as "falls out"
(PLN-1 transitivity, PLN-2 prerequisite propagation).

**Do:**

- Drive every *new implementation decision* from a genuinely red test (the
  `/tdd` red gate).
- Add the remaining contract specs as **pins** (triangulation): expect them
  green, and treat an unexpectedly red pin as an implementation bug. Make the
  pin's intent visible in the test name or a one-line comment (e.g. "the
  'anonymous' bucket label is not a user id").
- Don't manufacture artificial reds (deliberately mis-ordering code to watch a
  pin fail) — that is theatre, not TDD.

**Possible follow-up (separate docs PR):** the `/tdd` skill's "a test that
passes with no implementation is dead weight" line could acknowledge pinning
tests explicitly; today the letter of the rule and this legitimate practice
disagree.
