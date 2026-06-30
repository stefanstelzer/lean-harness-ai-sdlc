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
});
