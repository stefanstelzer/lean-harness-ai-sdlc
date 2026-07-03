/**
 * Domain types for the demo feature-flag engine.
 *
 * Architecture rule (enforced by scripts/archgate.mjs): this module is the
 * lowest layer and MUST NOT import from any other module in src/.
 */

/** A single feature flag definition. */
export interface FeatureFlag {
  /** Stable, unique key, e.g. `checkout.new-cart`. */
  key: string;
  /** Whether the flag is on by default. */
  enabled: boolean;
  /**
   * Optional percentage rollout (0–100). When set, the flag is enabled for a
   * deterministic subset of users derived from the user id.
   */
  rollout?: number;
  /**
   * Optional user ids that always pass this flag's percentage gate. The list
   * bypasses only `rollout` — `enabled: false`, `denyUsers`, and `requires`
   * all still apply. Ignored when the evaluation context has no `userId`.
   */
  allowUsers?: string[];
  /**
   * Optional user ids that never see this flag. Deny wins over `allowUsers`
   * and applies at any rollout, including a full one. Ignored when the
   * evaluation context has no `userId`.
   */
  denyUsers?: string[];
  /**
   * Optional prerequisite flag keys. The flag evaluates `true` only when it is
   * itself enabled AND every listed prerequisite is enabled for the same
   * evaluation context. Unknown keys fail closed; cycles are rejected at
   * registration time.
   */
  requires?: string[];
}

/** Context used when evaluating a flag. */
export interface EvaluationContext {
  /** Stable identifier of the current user, used for percentage rollouts. */
  userId?: string;
}
