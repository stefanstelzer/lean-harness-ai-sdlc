# Refactor Candidates

Reference for [`tdd`](SKILL.md). Only refactor while **green**, and run the suite after each step.

- **Duplication** → extract a function or class
- **Long methods** → break into private helpers (keep the tests on the public interface)
- **Shallow modules** → combine or deepen (a small interface over a deep implementation)
- **Feature envy** → move logic to where the data lives
- **Primitive obsession** → introduce value objects
- **Existing code** the new code reveals as problematic
