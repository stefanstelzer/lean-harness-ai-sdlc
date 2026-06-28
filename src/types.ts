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
}

/** Context used when evaluating a flag. */
export interface EvaluationContext {
  /** Stable identifier of the current user, used for percentage rollouts. */
  userId?: string;
}
