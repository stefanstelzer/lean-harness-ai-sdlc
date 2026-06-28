import { describe, expect, it } from 'vitest';
import * as api from '../../src/index.js';

/**
 * Smoke test: the public barrel exports the expected surface. Cheap guard
 * against accidental breaking changes to the package entry point.
 */
describe('public API surface', () => {
  it('exports FeatureFlags and hashToBucket', () => {
    expect(typeof api.FeatureFlags).toBe('function');
    expect(typeof api.hashToBucket).toBe('function');
  });

  it('can construct and evaluate via the barrel', () => {
    const flags = new api.FeatureFlags([{ key: 'smoke', enabled: true }]);
    expect(flags.isEnabled('smoke')).toBe(true);
  });
});
