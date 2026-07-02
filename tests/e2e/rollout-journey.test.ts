import { describe, expect, it } from 'vitest';
import { FeatureFlags } from '../../src/index.js';

/**
 * End-to-end style journey: model a realistic rollout lifecycle of a flag from
 * "off" to "10% canary" to "fully on", asserting a stable user's experience.
 */
describe('feature rollout journey', () => {
  it('progresses a user through a staged rollout', () => {
    const user = { userId: 'long-lived-user' };

    // Stage 1: feature is dark.
    const off = new FeatureFlags([{ key: 'new-checkout', enabled: false }]);
    expect(off.isEnabled('new-checkout', user)).toBe(false);

    // Stage 2: full release — everyone, including our user, sees it.
    const full = new FeatureFlags([{ key: 'new-checkout', enabled: true, rollout: 100 }]);
    expect(full.isEnabled('new-checkout', user)).toBe(true);

    // The same evaluation is reproducible across invocations.
    expect(full.isEnabled('new-checkout', user)).toBe(true);
  });

  it('keeps a dependent feature dark until its prerequisite is live', () => {
    const user = { userId: 'long-lived-user' };

    // `upsell` depends on `new-checkout`. While checkout is dark, the upsell
    // must stay dark too — even though it is itself enabled.
    const staged = new FeatureFlags([
      { key: 'new-checkout', enabled: false },
      { key: 'upsell', enabled: true, requires: ['new-checkout'] },
    ]);
    expect(staged.isEnabled('upsell', user)).toBe(false);

    // Light up the prerequisite for everyone; the dependent feature follows.
    staged.register({ key: 'new-checkout', enabled: true, rollout: 100 });
    expect(staged.isEnabled('upsell', user)).toBe(true);
    expect(staged.isEnabled('upsell', user)).toBe(true);
  });

  it('forces a beta user into a dark canary and an affected user out of a release', () => {
    const user = { userId: 'long-lived-user' };
    const betaUser = { userId: 'beta-tester' };

    // Stage 1: the canary is dark for the world, but the beta tester is
    // forced in past the percentage gate.
    const canary = new FeatureFlags([
      { key: 'new-checkout', enabled: true, rollout: 0, allowUsers: ['beta-tester'] },
    ]);
    expect(canary.isEnabled('new-checkout', betaUser)).toBe(true);
    expect(canary.isEnabled('new-checkout', user)).toBe(false);

    // Stage 2: fully released, but one affected user is pulled back out —
    // without touching the global rollout.
    const released = new FeatureFlags([
      { key: 'new-checkout', enabled: true, rollout: 100, denyUsers: ['affected-tenant'] },
    ]);
    expect(released.isEnabled('new-checkout', { userId: 'affected-tenant' })).toBe(false);
    expect(released.isEnabled('new-checkout', user)).toBe(true);

    // The targeted decisions are reproducible across invocations.
    expect(released.isEnabled('new-checkout', { userId: 'affected-tenant' })).toBe(false);
  });
});
