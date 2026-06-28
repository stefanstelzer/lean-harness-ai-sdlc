# When to Mock

Reference for [`tdd`](SKILL.md). Mocking uses Vitest's `vi.mock(...)` (`GEN-005`).

Mock at **system boundaries** only:

- Databases and persistence (so unit tests run without live infrastructure — `GEN-005`)
- External APIs (payment, email, AI providers, etc.)
- Time and randomness
- The file system (sometimes)

Don't mock:

- Your own modules or classes
- Internal collaborators
- Anything you control — test it through its interface instead

## The mock-path gotcha

`vi.mock(path)` only intercepts when `path` matches the **import path the code under test actually uses**. A happy-path test that fails with "mock not called" almost always has a mismatched path — align the `vi.mock` argument with the real import.

## Designing for mockability

At the boundary, design interfaces that are easy to stub.

**1. Use dependency injection.** Pass external dependencies in rather than constructing them inside:

```typescript
// Easy to mock
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// Hard to mock
function processPayment(order) {
  const client = new PaymentClient(process.env.PAYMENT_KEY);
  return client.charge(order.total);
}
```

**2. Prefer SDK-style interfaces over one generic fetcher.** A specific function per operation is independently mockable:

```typescript
// GOOD: each function returns one shape, no conditional logic in the mock
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
};

// BAD: mocking requires branching inside the mock
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```
