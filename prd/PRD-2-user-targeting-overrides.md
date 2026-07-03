# PRD-2: Per-user targeting overrides

## Problem Statement

As a release engineer running a percentage rollout, I need specific users to be
deterministically inside or outside a feature — internal dogfooders and beta
customers must see it while the rollout is still at 0–5%, and a tenant that just
hit a bug must stop seeing it immediately. Today the engine offers only the
global `rollout` percentage as a lever: there is no way to force a single user in
or out. Teams work around it by bumping the rollout (exposing everyone) or by
branching on user ids in calling code, which re-encodes release policy at every
call site and drifts — the exact caller-side glue problem PRD-1 removed for
dependencies reappears for targeting.

## Solution

Let a flag name the users it is forced on or off for. A flag definition gains an
allow list ("these user ids always pass the percentage gate") and a deny list
("these user ids never see the flag"). The engine consults the lists as part of
the flag's own enablement decision: deny wins over allow, the allow list bypasses
only the percentage rollout, and the flag's master `enabled` switch and its
prerequisites keep their meaning. Targeting is expressed once, on the flag
definition, and a single `isEnabled(key, ctx)` call keeps yielding the correct
answer with no caller-side glue.

## User Stories

1. As a release engineer, I want to list user ids that always see a flag
   regardless of its rollout percentage, so that dogfooders and beta customers
   get the feature while the general rollout is still small or zero.
2. As a release engineer, I want to list user ids that never see a flag, so that
   a tenant that hit a bug is excluded instantly without lowering the global
   rollout for everyone else.
3. As a release engineer, I want the deny list to win when a user appears in both
   lists, so that an emergency exclusion is always effective (fail-closed).
4. As a release engineer, I want `enabled: false` to keep the flag off for
   everyone including allow-listed users, so that the master switch remains an
   unconditional kill switch.
5. As a release engineer, I want the deny list to apply even when the flag has no
   rollout or a 100% rollout, so that exclusion also works on fully released
   flags, not only during percentage ramps.
6. As a release engineer, I want overrides to leave prerequisite semantics
   intact — an allow-listed user still requires every prerequisite to be enabled
   for them — so that layered features never ship a half-built experience.
7. As a release engineer, I want overrides declared on a prerequisite flag to
   affect dependent flags for the same user, so that per-user forcing composes
   with dependency chains instead of fighting them.
8. As a developer, I want evaluations without a `userId` to be unaffected by
   override lists, so that the absence of identity never triggers a targeted
   decision.
9. As a developer, I want a flag that declares no override lists to behave
   exactly as today, so that the feature is fully backward compatible.
10. As a consumer of the library, I want `isEnabled` to stay deterministic and
    side-effect free with overrides in play, so that the same context yields the
    same answer every call.

## Implementation Decisions

- **Data shape.** The flag definition gains two optional, flat fields — an allow
  list and a deny list of user ids (`allowUsers?: string[]`,
  `denyUsers?: string[]`) — following the precedent of the existing flat optional
  fields (`rollout`, `requires`) rather than a nested override object. Absent or
  empty lists mean "no targeting" and preserve today's behaviour (story 9). This
  is an additive, backward-compatible change to the lowest-layer types module
  (`ARCH-001`).
- **Precedence inside the flag's own decision.** For the flag's own enablement
  (before prerequisites): unknown key or `enabled: false` → `false` (stories 4);
  else a `userId` on the deny list → `false` (stories 2, 3, 5); else a `userId`
  on the allow list → `true`, bypassing only the percentage gate (story 1); else
  the existing rollout decision applies unchanged.
- **Overrides never bypass prerequisites.** The prerequisite gate from PRD-1
  runs after the flag's own decision, exactly as today. Because prerequisites
  resolve through the same public evaluation path with the same context,
  overrides declared on a prerequisite propagate to dependents for that user
  (stories 6, 7) with no special-casing.
- **Matching (sharpened in PRD review).** Exact string equality between the raw
  `context.userId` and a list entry. Only an _absent_ `userId` matches no list
  (story 8); an explicitly empty-string id participates like any other value.
  The `anonymous` fallback exists only for rollout bucketing and never
  participates in override matching.
- **No new registration-time validation.** Overlapping allow/deny entries are
  legitimate configuration (deny wins at evaluation time); empty arrays are
  inert. The existing key and rollout validations are unchanged. _(Assumption —
  confirmed by default in simulation; revisit if list hygiene becomes a real
  operational problem.)_
- **No change to the public barrel.** The flag type is already re-exported from
  the barrel; the new optional fields ride along. The barrel stays
  re-export-only (`ARCH-001`).
- **No new ADR required (resolved in PRD review).** The feature introduces no
  new module, seam, or layering change — it extends the existing evaluation
  contract behind the existing public seam, which `ARCH-001` (layering) and
  `GEN-004`/`GEN-005` (test pairing at the seam) already govern. `/adr-author`
  was considered and deliberately not invoked.

## Testing Decisions

- **Seam.** Unchanged and single: the `FeatureFlags` class — `isEnabled` is the
  evaluation contract under test; `register`/constructor keep their existing
  validation contract. Tests exercise behaviour through that seam only, never
  internal helpers (per `/tdd`, `GEN-004`, `GEN-005`).
- **Behaviours to cover (precedence core first):**
  - an allow-listed user passes a `rollout: 0` flag; other users do not;
  - a deny-listed user fails a `rollout: 100` flag and a flag with no rollout;
  - a user on both lists is denied (deny > allow);
  - `enabled: false` beats the allow list (kill switch);
  - an anonymous evaluation (no `userId`) ignores both lists;
  - an allow-listed user on a dependent flag is still gated by its
    prerequisite;
  - a deny/allow entry on a prerequisite propagates to the dependent flag for
    that user;
  - a flag with no override lists behaves exactly as before (regression guard);
  - repeated evaluation with the same context is stable (determinism).
- **Prior art.** `tests/unit/feature-flags.test.ts` structures the existing
  contract as `percentage rollout` and `prerequisites` describe blocks; the new
  specs form a sibling `user targeting overrides` block in the same style. The
  e2e journey (`tests/e2e/rollout-journey.test.ts`) gains a canary chapter — a
  beta user forced in at low rollout, an affected user forced out — and the
  smoke layer is untouched (type-only surface addition).

## Out of Scope

- Segment, attribute, or rule-based targeting (anything beyond exact user-id
  match).
- Per-user rollout percentages or per-user variants.
- Time-boxed or expiring overrides.
- Registration-time linting of override lists (duplicates, overlaps).
- Persisting or loading flag definitions; the engine stays in-memory and
  dependency-free.

## Further Notes

The risk concentrates in the precedence order of the flag's own decision
(master switch > deny > allow > rollout) and its interaction with the
prerequisite gate — that is the tracer-bullet candidate for the plan. Everything
else (propagation through chains, anonymous behaviour, backward compatibility)
falls out of keeping overrides inside the existing own-decision step.

Simulation note: this PRD was produced in a non-interactive run; the seam
confirmation and the two marked assumptions (field naming and no new
registration-time validation) were resolved by default instead of by user
dialogue.

PRD review (grilling) outcome — core ambiguities surfaced and resolved
(simulation-resolved, most defensible answer from codebase/ADRs/industry
practice):

1. _Flat fields vs. nested override object_ — flat `allowUsers`/`denyUsers`,
   following the `rollout`/`requires` precedent in the flag type.
2. _Does the allow list beat the kill switch?_ — no; `enabled: false` wins over
   everything (targeting applies only while the flag is on).
3. _Do overrides bypass prerequisites?_ — no; dogfooding a layered feature means
   allow-listing the user on the prerequisite too, which composes through the
   shared evaluation path.
4. _New ADR?_ — not needed; no new seam, module, or layering rule (see
   Implementation Decisions).
