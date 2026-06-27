```markdown
# Anomalithic Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development conventions and workflows used in the Anomalithic TypeScript codebase. You'll learn about file naming, import/export styles, commit message conventions, and how to write and run tests. This guide is ideal for contributors aiming to maintain consistency and quality in the project.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `userService.ts`, `dataProcessor.test.ts`

### Import Style
- Mixed import styles are used, including both default and named imports.
  - Example:
    ```typescript
    import myFunction from './myFunction';
    import { helperA, helperB } from './helpers';
    ```

### Export Style
- Both default and named exports are present.
  - Example:
    ```typescript
    // Default export
    export default function processData() { ... }

    // Named export
    export function validateInput() { ... }
    ```

### Commit Messages
- Follows **conventional commit** format.
- Uses the `feat` prefix for new features.
- Example:
  ```
  feat: add user authentication middleware
  ```

## Workflows

### Feature Development
**Trigger:** When adding a new feature to the codebase  
**Command:** `/feature-development`

1. Create a new branch for your feature.
2. Use camelCase for any new file names.
3. Write code using mixed import/export styles as appropriate.
4. Write or update corresponding test files (`*.test.ts`).
5. Commit changes using the `feat:` prefix and a concise description.
6. Open a pull request for review.

### Testing
**Trigger:** When verifying code correctness  
**Command:** `/run-tests`

1. Identify or create test files matching the `*.test.*` pattern.
2. Run the test suite using the project's preferred test runner (framework unknown; check project documentation or scripts).
3. Ensure all tests pass before merging or deploying code.

## Testing Patterns

- Test files follow the `*.test.*` naming convention (e.g., `dataProcessor.test.ts`).
- The specific testing framework is unknown; refer to project scripts or documentation for details.
- Example test file:
  ```typescript
  import { processData } from './processData';

  test('should process data correctly', () => {
    expect(processData([1, 2, 3])).toEqual([2, 3, 4]);
  });
  ```

## Commands
| Command               | Purpose                                   |
|-----------------------|-------------------------------------------|
| /feature-development  | Guide for adding a new feature            |
| /run-tests            | Instructions for running the test suite   |
```
