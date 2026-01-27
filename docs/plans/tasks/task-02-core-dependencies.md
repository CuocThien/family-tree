# Task 02: Install Core Dependencies

**Phase:** 1 - Project Foundation
**Priority:** Critical
**Dependencies:** Task 01
**Estimated Complexity:** Low

---

## Objective

Install all required npm packages for the Family Tree application including MongoDB driver, authentication, state management, and UI utilities.

---

## Requirements

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| mongoose | ^8.0.0 | MongoDB ODM |
| next-auth | ^4.24.0 | Authentication |
| bcryptjs | ^2.4.3 | Password hashing |
| zustand | ^4.4.0 | State management |
| react-hook-form | ^7.49.0 | Form handling |
| @hookform/resolvers | ^3.3.0 | Form validation |
| zod | ^3.22.0 | Schema validation |
| clsx | ^2.0.0 | Conditional classes |
| tailwind-merge | ^2.0.0 | Tailwind class merging |
| lucide-react | ^0.294.0 | Icons |
| class-variance-authority | ^0.7.0 | Component variants |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @types/bcryptjs | ^2.4.6 | TypeScript types |
| prettier | ^3.1.0 | Code formatting |
| prettier-plugin-tailwindcss | ^0.5.0 | Tailwind class sorting |
| jest | ^29.7.0 | Testing framework |
| @testing-library/react | ^14.1.0 | React testing |
| @testing-library/jest-dom | ^6.1.0 | DOM assertions |

---

## Input Validation

### Pre-conditions

- [ ] Task 01 completed successfully
- [ ] package.json exists
- [ ] npm is available
- [ ] Internet connection for npm registry

### Validation Steps

```bash
# Verify package.json exists
cat package.json | head -5

# Verify npm registry accessible
npm ping
```

---

## Implementation Steps

### Step 1: Install Production Dependencies

```bash
npm install mongoose@^8.0.0 next-auth@^4.24.0 bcryptjs@^2.4.3 zustand@^4.4.0 react-hook-form@^7.49.0 @hookform/resolvers@^3.3.0 zod@^3.22.0 clsx@^2.0.0 tailwind-merge@^2.0.0 lucide-react@^0.294.0 class-variance-authority@^0.7.0
```

**Verification:**
```bash
npm list mongoose next-auth bcryptjs zustand
```

### Step 2: Install Development Dependencies

```bash
npm install -D @types/bcryptjs@^2.4.6 prettier@^3.1.0 prettier-plugin-tailwindcss@^0.5.0 jest@^29.7.0 @testing-library/react@^14.1.0 @testing-library/jest-dom@^6.1.0 @types/jest ts-jest
```

**Verification:**
```bash
npm list --dev prettier jest
```

### Step 3: Create Prettier Configuration

Create `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### Step 4: Create Jest Configuration

Create `jest.config.js`:

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

### Step 5: Create Jest Setup

Create `jest.setup.js`:

```javascript
import '@testing-library/jest-dom';
```

### Step 6: Update package.json Scripts

Add to package.json scripts:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

### Step 7: Verify Installation

```bash
npm run format:check
npm test -- --passWithNoTests
```

---

## Edge Cases

### EC-1: npm Registry Unavailable

**Scenario:** npm registry unreachable
**Detection:** `npm ping` fails
**Resolution:**
- Check internet connection
- Try alternative registry: `npm config set registry https://registry.npmmirror.com`

### EC-2: Package Version Conflicts

**Scenario:** Peer dependency conflicts
**Detection:** npm warns about peer dependencies
**Resolution:**
- Use `--legacy-peer-deps` flag
- Or resolve conflicts manually

### EC-3: Disk Space Insufficient

**Scenario:** npm install fails mid-way
**Detection:** ENOSPC error
**Resolution:** Free disk space, clear npm cache

### EC-4: TypeScript Version Mismatch

**Scenario:** @types packages incompatible with TypeScript version
**Detection:** Type errors during build
**Resolution:** Align TypeScript and @types versions

---

## Acceptance Criteria

- [ ] All production dependencies installed
- [ ] All dev dependencies installed
- [ ] `npm run build` still succeeds
- [ ] `npm run format:check` works
- [ ] `npm test -- --passWithNoTests` passes
- [ ] No peer dependency warnings (or documented exceptions)

---

## Rollback Plan

```bash
# Remove node_modules and reinstall base packages
rm -rf node_modules package-lock.json
npm install
```

---

## Security Considerations

- bcryptjs uses secure hashing (cost factor 10+)
- next-auth handles session security
- zod provides runtime validation
- Audit packages: `npm audit`
