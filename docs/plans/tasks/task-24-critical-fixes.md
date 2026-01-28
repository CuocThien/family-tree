# Task 24: Critical Fixes

**Status:** Pending
**Priority:** CRITICAL
**Estimated Time:** 10-15 hours
**Dependencies:** None

## Overview

Fix all build-breaking errors and complete incomplete implementations that are blocking deployment. This task must be completed before any other review or testing work can proceed.

## Current Issues

### Build-Breaking Errors (2)
1. **Import Error in User Profile API**
   - File: `src/app/api/user/profile/route.ts:3`
   - Issue: `import { getDIContainer } from '@/lib/di'`
   - Error: Export doesn't exist
   - Fix: Use `getContainer` or `container` from '@/lib/di/container'

2. **NextAuth Middleware Error**
   - File: `src/middleware.ts:7`
   - Issue: `import { withAuth } from 'next-auth/middleware'`
   - Error: Export doesn't exist in NextAuth v5
   - Fix: Use NextAuth v5 middleware pattern

### Test Failures
- **PersonService.test.ts**: 9 test failures due to missing Permission enum import

### Incomplete Implementations
- EmailService: All methods are placeholders
- User profile API route: Incomplete (TODO comments)
- Server Component usage issues in services

---

## Implementation Steps

### Phase 1: Fix Build Errors (2-3 hours)

#### Step 1.1: Fix User Profile API Import
**File:** `src/app/api/user/profile/route.ts`

```typescript
// BEFORE (incorrect):
import { getDIContainer } from '@/lib/di';

// AFTER (correct):
import { getContainer } from '@/lib/di/container';
// OR
import { container } from '@/lib/di/containerConfig';
```

**Actions:**
1. Read current file content
2. Identify correct import from '@/lib/di/container'
3. Update import statement
4. Verify the DI container usage is correct

#### Step 1.2: Fix NextAuth v5 Middleware
**File:** `src/middleware.ts`

NextAuth v5 uses a different middleware pattern. Research and implement correct approach:

```typescript
// NextAuth v5 pattern
import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'

export default auth((req) => {
  // Handle authenticated routes
  const isLoggedIn = !!req.auth
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard')
  const isOnSettings = req.nextUrl.pathname.startsWith('/settings')

  if (isOnDashboard || isOnSettings) {
    if (isLoggedIn) return NextResponse.next()
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

**Actions:**
1. Research NextAuth v5 middleware documentation
2. Update middleware.ts with correct pattern
3. Test authentication flow
4. Verify protected routes are secured

#### Step 1.3: Fix Permission Enum Import
**File:** `src/services/person/PersonService.ts:18`

```typescript
// Add missing import:
import { Permission } from '../permission/IPermissionService';
```

**Actions:**
1. Add Permission enum import
2. Verify all Permission usages in the file
3. Run tests to confirm fix

---

### Phase 2: Complete Incomplete Implementations (4-5 hours)

#### Step 2.1: Implement EmailService
**File:** `src/services/email/EmailService.ts`

Current state: All methods are placeholders with TODO comments.

**Options:**
- **Option A**: Implement actual email sending (using Resend, SendGrid, or Nodemailer)
- **Option B**: Create comprehensive mock for development/testing

**Recommended:** Start with mock implementation, add real email service later.

**Mock Implementation Template:**

```typescript
import { IEmailService } from './IEmailService';
import { IEmailOptions, IEmailTemplate } from '@/types';

export class EmailService implements IEmailService {
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    // Mock implementation - log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[EmailService] Welcome email sent to:', email);
      return;
    }
    // Real implementation would use email provider
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    console.log('[EmailService] Password reset email sent to:', email);
  }

  async sendInvitationEmail(
    email: string,
    inviterName: string,
    treeName: string,
    inviteToken: string
  ): Promise<void> {
    console.log('[EmailService] Invitation email sent to:', email);
  }

  async sendNotificationEmail(
    email: string,
    notificationType: string,
    data: Record<string, unknown>
  ): Promise<void> {
    console.log('[EmailService] Notification email sent to:', email);
  }

  async sendEmail(options: IEmailOptions): Promise<void> {
    console.log('[EmailService] Email sent:', options);
  }

  async sendTemplate(template: IEmailTemplate): Promise<void> {
    console.log('[EmailService] Template email sent:', template);
  }
}
```

**Actions:**
1. Implement mock EmailService methods
2. Add error handling
3. Add logging
4. Write unit tests

#### Step 2.2: Complete User Profile API
**File:** `src/app/api/user/profile/route.ts`

Current state: Has TODO comments for PUT and DELETE operations.

**Required Implementation:**

```typescript
// PUT /api/user/profile - Update user profile
export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, bio, avatar } = body;

    const userService = getContainer().resolve<IUserService>('UserService');
    const updatedUser = await userService.updateProfile(session.user.id, {
      name,
      email,
      bio,
      avatar,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
```

**Actions:**
1. Implement PUT endpoint for profile updates
2. Add validation for profile data
3. Update UserService if needed to support profile updates
4. Add error handling

#### Step 2.3: Fix Server Component Usage Issues
**Files:**
- `src/services/tree/TreeService.ts`
- `src/lib/di/containerConfig.ts`
- `src/lib/auth.ts`
- `src/app/(dashboard)/settings/page.tsx`

**Issue:** Services and DI container being used in Server Components with async operations.

**Solution Pattern:**
1. Keep Server Components for layout and initial data fetching
2. Move business logic to API routes
3. Use Client Components for interactivity

**Actions:**
1. Audit each file for Server Component issues
2. Refactor to use API routes for data operations
3. Ensure proper separation of concerns

---

### Phase 3: Verify Build & Tests (2-3 hours)

#### Step 3.1: Fix PersonService Tests
**File:** `src/services/person/PersonService.test.ts`

**Actions:**
1. Add missing Permission enum import
2. Review all 9 failing tests
3. Fix any additional issues found
4. Ensure all tests pass

#### Step 3.2: Run Build Verification
```bash
npm run build
```

**Expected:** Build completes successfully with no errors

#### Step 3.3: Run Type Check
```bash
npm run type-check
# or
npx tsc --noEmit
```

**Expected:** No type errors

#### Step 3.4: Run All Tests
```bash
npm test
```

**Expected:** All tests pass (may need to skip incomplete features)

---

### Phase 4: Update DI Container Configuration (1-2 hours)

#### Step 4.1: Review Container Registration
**File:** `src/lib/di/containerConfig.ts`

**Actions:**
1. Verify all services are registered
2. Add EmailService registration
3. Ensure correct lifecycle (singleton vs transient)
4. Add any missing services

#### Step 4.2: Test Container Resolution
**Actions:**
1. Create test script to verify all services resolve
2. Test service dependencies
3. Verify no circular dependencies

---

## Acceptance Criteria

- [ ] Build completes successfully (`npm run build`)
- [ ] No TypeScript errors
- [ ] All existing tests pass
- [ ] PersonService tests pass (0 failures)
- [ ] EmailService has working implementation (mock or real)
- [ ] User profile API is complete
- [ ] Middleware works correctly with NextAuth v5
- [ ] No TODO comments remain in critical paths

---

## Testing Checklist

- [ ] Test user registration flow
- [ ] Test login flow
- [ ] Test protected route access
- [ ] Test profile update endpoint
- [ ] Test email service methods
- [ ] Test container resolution

---

## Notes

- This task is blocking all other review and testing work
- Focus on getting the build green, not perfect implementation
- EmailService can use mock implementation initially
- Document any issues found that need deeper investigation
- Create GitHub issues for any non-critical problems discovered

---

## Next Steps

After completing this task:
1. Task 25: Code Review & Refactoring
2. Task 26: Unit & Integration Testing
3. Task 27: E2E Testing & Documentation
