import { describe, expect, it } from 'vitest';
import { FeatureFlags, hashToBucket } from '../../src/feature-flags.js';

describe('FeatureFlags', () => {
  it('returns false for unknown keys', () => {
    const flags = new FeatureFlags();
    expect(flags.isEnabled('does.not.exist')).toBe(false);
  });

  it('respects a statically enabled flag', () => {
    const flags = new FeatureFlags([{ key: 'a', enabled: true }]);
    expect(flags.isEnabled('a')).toBe(true);
  });

  it('respects a statically disabled flag', () => {
    const flags = new FeatureFlags([{ key: 'a', enabled: false }]);
    expect(flags.isEnabled('a')).toBe(false);
  });

  it('lists registered keys', () => {
    const flags = new FeatureFlags([
      { key: 'a', enabled: true },
      { key: 'b', enabled: false },
    ]);
    expect(flags.keys().sort()).toEqual(['a', 'b']);
  });

  it('supports fluent registration', () => {
    const flags = new FeatureFlags().register({ key: 'x', enabled: true });
    expect(flags.isEnabled('x')).toBe(true);
  });

  it('rejects empty keys', () => {
    expect(() => new FeatureFlags().register({ key: '  ', enabled: true })).toThrow(
      /must not be empty/,
    );
  });

  it('rejects out-of-range rollout', () => {
    expect(() => new FeatureFlags().register({ key: 'x', enabled: true, rollout: 150 })).toThrow(
      /between 0 and 100/,
    );
  });

  describe('percentage rollout', () => {
    it('treats rollout >= 100 as fully enabled', () => {
      const flags = new FeatureFlags([{ key: 'x', enabled: true, rollout: 100 }]);
      expect(flags.isEnabled('x', { userId: 'anyone' })).toBe(true);
    });

    it('treats rollout <= 0 as disabled', () => {
      const flags = new FeatureFlags([{ key: 'x', enabled: true, rollout: 0 }]);
      expect(flags.isEnabled('x', { userId: 'anyone' })).toBe(false);
    });

    it('is deterministic for the same user', () => {
      const flags = new FeatureFlags([{ key: 'x', enabled: true, rollout: 50 }]);
      const first = flags.isEnabled('x', { userId: 'user-42' });
      const second = flags.isEnabled('x', { userId: 'user-42' });
      expect(first).toBe(second);
    });

    it('rolls out to roughly the configured percentage', () => {
      const flags = new FeatureFlags([{ key: 'x', enabled: true, rollout: 30 }]);
      let enabled = 0;
      const total = 1000;
      for (let i = 0; i < total; i++) {
        if (flags.isEnabled('x', { userId: `user-${i}` })) {
          enabled++;
        }
      }
      const ratio = enabled / total;
      expect(ratio).toBeGreaterThan(0.2);
      expect(ratio).toBeLessThan(0.4);
    });
  });

  describe('prerequisites', () => {
    it('rejects a direct self-cycle at registration', () => {
      expect(() => new FeatureFlags([{ key: 'a', enabled: true, requires: ['a'] }])).toThrow(
        /cycle.*"a"|"a".*cycle/i,
      );
    });

    it('rejects an indirect cycle at registration', () => {
      const flags = new FeatureFlags([{ key: 'a', enabled: true, requires: ['b'] }]);
      expect(() => flags.register({ key: 'b', enabled: true, requires: ['a'] })).toThrow(/cycle/i);
    });

    it('rejects an overwrite that closes a cycle', () => {
      const flags = new FeatureFlags([
        { key: 'a', enabled: true },
        { key: 'b', enabled: true, requires: ['a'] },
      ]);
      // Re-registering 'a' to require 'b' would close a → b → a.
      expect(() => flags.register({ key: 'a', enabled: true, requires: ['b'] })).toThrow(/cycle/i);
      // …and the failed overwrite left the original 'a' intact and evaluable.
      expect(flags.isEnabled('a')).toBe(true);
    });

    it('is enabled when its single prerequisite is enabled', () => {
      const flags = new FeatureFlags([
        { key: 'base', enabled: true },
        { key: 'dependent', enabled: true, requires: ['base'] },
      ]);
      expect(flags.isEnabled('dependent')).toBe(true);
    });

    it('is disabled when a prerequisite is disabled', () => {
      const flags = new FeatureFlags([
        { key: 'base', enabled: false },
        { key: 'dependent', enabled: true, requires: ['base'] },
      ]);
      expect(flags.isEnabled('dependent')).toBe(false);
    });

    it('requires ALL prerequisites to be enabled', () => {
      const flags = new FeatureFlags([
        { key: 'b', enabled: true },
        { key: 'c', enabled: false },
        { key: 'a', enabled: true, requires: ['b', 'c'] },
      ]);
      expect(flags.isEnabled('a')).toBe(false);
      flags.register({ key: 'c', enabled: true });
      expect(flags.isEnabled('a')).toBe(true);
    });

    it('resolves a transitive chain a -> b -> c', () => {
      const flags = new FeatureFlags([
        { key: 'c', enabled: true },
        { key: 'b', enabled: true, requires: ['c'] },
        { key: 'a', enabled: true, requires: ['b'] },
      ]);
      expect(flags.isEnabled('a')).toBe(true);
      flags.register({ key: 'c', enabled: false });
      expect(flags.isEnabled('a')).toBe(false);
    });

    it('gates the dependent flag by the prerequisite rollout for the same user', () => {
      const flags = new FeatureFlags([
        { key: 'base', enabled: true, rollout: 50 },
        { key: 'dependent', enabled: true, requires: ['base'] },
      ]);
      // The dependent flag tracks the base flag's per-user decision exactly.
      for (const userId of ['u1', 'u2', 'u3', 'u4', 'u5']) {
        expect(flags.isEnabled('dependent', { userId })).toBe(flags.isEnabled('base', { userId }));
      }
    });

    it('fails closed when a prerequisite key is unknown', () => {
      const flags = new FeatureFlags([{ key: 'dependent', enabled: true, requires: ['ghost'] }]);
      expect(flags.isEnabled('dependent')).toBe(false);
    });

    it('is unchanged for a flag with no prerequisites', () => {
      const flags = new FeatureFlags([{ key: 'plain', enabled: true }]);
      expect(flags.isEnabled('plain')).toBe(true);
    });
  });

  describe('user targeting overrides', () => {
    it('denies a deny-listed user even at full rollout', () => {
      const flags = new FeatureFlags([
        { key: 'plain', enabled: true, denyUsers: ['u-bad'] },
        { key: 'full', enabled: true, rollout: 100, denyUsers: ['u-bad'] },
      ]);
      expect(flags.isEnabled('plain', { userId: 'u-bad' })).toBe(false);
      expect(flags.isEnabled('full', { userId: 'u-bad' })).toBe(false);
      // Other users are untouched by the deny list.
      expect(flags.isEnabled('plain', { userId: 'u-ok' })).toBe(true);
    });

    it('admits an allow-listed user past the percentage gate', () => {
      const flags = new FeatureFlags([
        { key: 'canary', enabled: true, rollout: 0, allowUsers: ['beta-1'] },
      ]);
      expect(flags.isEnabled('canary', { userId: 'beta-1' })).toBe(true);
      // The allow list admits only its members; everyone else keeps the
      // rollout decision.
      expect(flags.isEnabled('canary', { userId: 'someone-else' })).toBe(false);
    });

    it('lets the deny list win over the allow list', () => {
      const flags = new FeatureFlags([
        { key: 'x', enabled: true, allowUsers: ['u-both'], denyUsers: ['u-both'] },
      ]);
      expect(flags.isEnabled('x', { userId: 'u-both' })).toBe(false);
    });

    it('keeps the kill switch above the allow list', () => {
      const flags = new FeatureFlags([{ key: 'x', enabled: false, allowUsers: ['beta-1'] }]);
      expect(flags.isEnabled('x', { userId: 'beta-1' })).toBe(false);
    });

    it('ignores both lists when the evaluation has no userId', () => {
      const flags = new FeatureFlags([
        { key: 'on', enabled: true, denyUsers: ['anonymous'] },
        { key: 'off', enabled: true, rollout: 0, allowUsers: ['anonymous'] },
      ]);
      // The 'anonymous' rollout bucket label is not a user id: an evaluation
      // without a userId must never match a list entry of that name.
      expect(flags.isEnabled('on')).toBe(true);
      expect(flags.isEnabled('off')).toBe(false);
    });

    it('still gates an allow-listed user by the prerequisites', () => {
      const flags = new FeatureFlags([
        { key: 'base', enabled: false },
        { key: 'dep', enabled: true, rollout: 0, allowUsers: ['beta-1'], requires: ['base'] },
      ]);
      // Allow-listing never bypasses `requires` — the chain stays dark…
      expect(flags.isEnabled('dep', { userId: 'beta-1' })).toBe(false);
      // …until the prerequisite is live, at which point the allow list
      // admits the user past the dependent's own percentage gate.
      flags.register({ key: 'base', enabled: true });
      expect(flags.isEnabled('dep', { userId: 'beta-1' })).toBe(true);
    });

    it('lights a dependent through an allow-listed prerequisite', () => {
      const flags = new FeatureFlags([
        { key: 'base', enabled: true, rollout: 0, allowUsers: ['beta-1'] },
        { key: 'dep', enabled: true, requires: ['base'] },
      ]);
      expect(flags.isEnabled('dep', { userId: 'beta-1' })).toBe(true);
      expect(flags.isEnabled('dep', { userId: 'someone-else' })).toBe(false);
    });

    it('darkens a dependent through a deny-listed prerequisite', () => {
      const flags = new FeatureFlags([
        { key: 'base', enabled: true, rollout: 100, denyUsers: ['u-bad'] },
        { key: 'dep', enabled: true, requires: ['base'] },
      ]);
      expect(flags.isEnabled('dep', { userId: 'u-bad' })).toBe(false);
      expect(flags.isEnabled('dep', { userId: 'u-ok' })).toBe(true);
    });

    it('is deterministic for the same context', () => {
      const flags = new FeatureFlags([
        { key: 'x', enabled: true, rollout: 50, allowUsers: ['beta-1'], denyUsers: ['u-bad'] },
      ]);
      for (const userId of ['beta-1', 'u-bad', 'u-random']) {
        expect(flags.isEnabled('x', { userId })).toBe(flags.isEnabled('x', { userId }));
      }
    });

    it('is unchanged for a flag with no override lists', () => {
      const flags = new FeatureFlags([{ key: 'plain', enabled: true, rollout: 100 }]);
      expect(flags.isEnabled('plain', { userId: 'anyone' })).toBe(true);
    });
  });
});

describe('hashToBucket', () => {
  it('is stable and bounded to [0, 100)', () => {
    const bucket = hashToBucket('seed');
    expect(bucket).toBe(hashToBucket('seed'));
    expect(bucket).toBeGreaterThanOrEqual(0);
    expect(bucket).toBeLessThan(100);
  });
});
