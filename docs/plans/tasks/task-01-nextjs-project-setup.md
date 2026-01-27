# Task 01: Initialize Next.js 14+ Project

**Phase:** 1 - Project Foundation
**Priority:** Critical
**Dependencies:** None
**Estimated Complexity:** Low

---

## Objective

Set up the base Next.js 14+ project with TypeScript, Tailwind CSS, and ESLint configuration.

---

## Requirements

### Functional Requirements

1. Create Next.js 14+ project with App Router
2. Enable TypeScript with strict mode
3. Configure Tailwind CSS with custom theme
4. Set up ESLint with recommended rules
5. Configure path aliases (@/*)

### Non-Functional Requirements

1. Use npm as package manager
2. Enable src/ directory structure
3. Disable Turbopack (stability concerns)
4. Configure for production deployment

---

## Input Validation

### Pre-conditions

- [ ] Node.js >= 18.x installed
- [ ] npm >= 9.x installed
- [ ] No existing family-tree directory conflicts
- [ ] Sufficient disk space (>500MB)

### Validation Steps

```bash
# Verify Node.js version
node --version  # Expected: v18.x or higher

# Verify npm version
npm --version   # Expected: 9.x or higher

# Check for directory conflicts
ls -la | grep family-tree  # Expected: no output
```

---

## Implementation Steps

### Step 1: Create Next.js Project

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```

**Expected Output:**
- package.json created
- tsconfig.json created
- tailwind.config.ts created
- next.config.ts created
- src/app/ directory created

### Step 2: Verify Project Structure

```bash
ls -la
```

**Expected Files:**
- package.json
- package-lock.json
- tsconfig.json
- tailwind.config.ts
- next.config.ts
- postcss.config.mjs
- .eslintrc.json
- .gitignore
- src/
- public/
- node_modules/

### Step 3: Update Tailwind Configuration

Modify `tailwind.config.ts` with project theme:

```typescript
const config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#13c8ec",
        "background-light": "#f6f8f8",
        "background-dark": "#101f22",
      },
      fontFamily: {
        display: ["Work Sans", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "1rem",
        xl: "1.5rem",
      },
    },
  },
  plugins: [],
};
```

### Step 4: Update TypeScript Configuration

Ensure `tsconfig.json` has strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

### Step 5: Verify Build

```bash
npm run build
```

**Expected:** Build completes without errors

---

## Edge Cases

### EC-1: Existing Directory Conflict

**Scenario:** User runs in existing directory with files
**Detection:** `ls -la` shows unexpected files
**Resolution:** Either clean directory or use different location

### EC-2: Node.js Version Mismatch

**Scenario:** Node.js < 18 installed
**Detection:** `node --version` returns v16.x or lower
**Resolution:** Install nvm and switch to Node.js 18+

### EC-3: npm Permission Issues

**Scenario:** npm install fails with EACCES
**Detection:** Error message contains "permission denied"
**Resolution:** Fix npm permissions or use nvm

### EC-4: Port 3000 Already in Use

**Scenario:** `npm run dev` fails due to port conflict
**Detection:** Error "EADDRINUSE"
**Resolution:** Kill process on port 3000 or use different port

---

## Acceptance Criteria

- [ ] `npm run dev` starts development server successfully
- [ ] `npm run build` completes without errors
- [ ] `npm run lint` passes with no errors
- [ ] TypeScript compilation succeeds
- [ ] Tailwind CSS styles apply correctly
- [ ] Path alias @/* works in imports

---

## Rollback Plan

If setup fails:

1. Delete all created files: `rm -rf node_modules package-lock.json`
2. Clear npm cache: `npm cache clean --force`
3. Retry with verbose logging: `npm install --verbose`

---

## Test Verification

```bash
# Quick smoke test
npm run dev &
sleep 5
curl http://localhost:3000 | head -20
# Expected: HTML response with Next.js content
```
