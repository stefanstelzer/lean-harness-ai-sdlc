# Good and Bad Tests

Reference for [`tdd`](SKILL.md). Examples use Vitest (`GEN-005`).

## Good tests

Integration-style: test through real interfaces, not mocks of internal parts.

```typescript
// GOOD: tests observable behaviour through the public interface
test("createUser makes the user retrievable", async () => {
  const user = await createUser({ name: "Alice" });
  const retrieved = await getUser(user.id);
  expect(retrieved.name).toBe("Alice");
});
```

The validation contract comes first — the boundary the caller must respect (`GEN-004`):

```typescript
// GOOD: the contract says "reject an empty name"
it("rejects an empty name", async () => {
  await expect(createUser({ name: "" }))
    .rejects.toMatchObject({ code: "invalid_argument" });
});
```

Characteristics:

- Tests behaviour the caller cares about
- Uses the public API only
- Survives internal refactors
- Describes WHAT, not HOW
- One logical assertion per test

## Bad tests

Implementation-detail tests, coupled to internal structure.

```typescript
// BAD: asserts on an internal collaborator and its call
test("checkout calls paymentService.process", async () => {
  const spy = vi.spyOn(paymentService, "process");
  await checkout(cart, payment);
  expect(spy).toHaveBeenCalledWith(cart.total);
});
```

Red flags:

- Mocking internal collaborators
- Testing private methods
- Asserting on call counts or order
- Test breaks on a refactor with no behaviour change
- Test name describes HOW, not WHAT
- Verifying through a side channel instead of the interface

```typescript
// BAD: bypasses the interface to verify
test("createUser saves to the store", async () => {
  await createUser({ name: "Alice" });
  const rows = await store.query("users", { name: "Alice" });
  expect(rows.length).toBeGreaterThan(0);
});

// GOOD: verifies through the interface (see the first example above)
```
