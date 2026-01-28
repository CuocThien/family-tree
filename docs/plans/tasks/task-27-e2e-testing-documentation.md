# Task 27: E2E Testing & Documentation

**Status:** Pending
**Priority:** MEDIUM
**Estimated Time:** 18-25 hours
**Dependencies:** Task 24, 25, 26 should be complete

## Overview

Set up Playwright for end-to-end testing and create comprehensive tests for critical user journeys. Additionally, update all project documentation to be clear, accurate, and helpful for developers.

---

## Part 1: E2E Testing with Playwright (10-14 hours)

### Current State
- E2E tests directory exists but is empty
- No E2E test framework configured
- No critical user journey coverage

### Implementation Steps

#### Step 1.1: Install and Configure Playwright (1-2 hours)

**Installation:**
```bash
npm install -D @playwright/test
npx playwright install
```

**Configuration:** `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Setup File:** `tests/e2e/setup.ts`

```typescript
import { test as base } from '@playwright/test';

export const test = base.extend({
  // Extend test with authenticated page
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await use(page);
  },
});

export { expect } from '@playwright/test';
```

#### Step 1.2: Create Test Data Fixtures (1-2 hours)

**File:** `tests/e2e/fixtures/test-data.ts`

```typescript
export const testUsers = {
  newUser: {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User',
  },
  existingUser: {
    email: 'existing@example.com',
    password: 'ExistingPassword123!',
    name: 'Existing User',
  },
};

export const testTrees = {
  basicTree: {
    name: 'Test Family Tree',
    description: 'A test family tree for E2E testing',
  },
};

export const testPersons = {
  father: {
    name: 'John Doe',
    birthDate: '1980-01-01',
    gender: 'male',
    bio: 'Test father person',
  },
  mother: {
    name: 'Jane Doe',
    birthDate: '1982-05-15',
    gender: 'female',
    bio: 'Test mother person',
  },
  child: {
    name: 'Baby Doe',
    birthDate: '2010-03-20',
    gender: 'male',
    bio: 'Test child person',
  },
};

export async function setupTestData(apiURL: string) {
  // Setup test data via API calls
  // Create test user, tree, persons
}

export async function cleanupTestData(apiURL: string) {
  // Clean up test data via API calls
}
```

#### Step 1.3: Write Critical User Journey Tests (6-8 hours)

**Test 1: User Registration and Login**
`tests/e2e/auth/registration-flow.spec.ts`

```typescript
import { test, expect } from '../../setup';

test.describe('User Registration Flow', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/register');

    // Fill registration form
    await page.fill('input[name="name"]', 'New User');
    await page.fill('input[name="email"]', `new-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/register');

    // Submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should logout successfully', async ({ authenticatedPage: page }) => {
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');

    await expect(page).toHaveURL('/');
  });
});
```

**Test 2: Create and Manage Family Tree**
`tests/e2e/trees/tree-management.spec.ts`

```typescript
import { test, expect } from '../../setup';

test.describe('Tree Management Flow', () => {
  test('should create first family tree', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');

    // Click "Create New Tree" button
    await page.click('text=Create New Tree');

    // Fill tree form
    await page.fill('input[name="name"]', 'My Family Tree');
    await page.fill('textarea[name="description"]', 'Testing family tree creation');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to tree board
    await expect(page).toHaveURL(/\/trees\/[a-f0-9]+/);
    await expect(page.locator('h1')).toContainText('My Family Tree');
  });

  test('should display existing trees in dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');

    // Should show tree cards
    await expect(page.locator('[data-testid="tree-card"]')).toHaveCount(1);
  });

  test('should edit tree details', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');

    // Click on tree settings
    await page.click('[data-testid="tree-card"] [data-testid="tree-settings"]');
    await page.click('text=Edit');

    // Update tree name
    await page.fill('input[name="name"]', 'Updated Family Tree');
    await page.click('button[type="submit"]');

    // Should show updated name
    await expect(page.locator('h1')).toContainText('Updated Family Tree');
  });

  test('should delete tree', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');

    // Click on tree settings
    await page.click('[data-testid="tree-card"] [data-testid="tree-settings"]');
    await page.click('text=Delete');

    // Confirm deletion
    await page.click('text=Confirm');

    // Should show success message
    await expect(page.locator('text=Tree deleted')).toBeVisible();
  });
});
```

**Test 3: Add and Manage Persons**
`tests/e2e/persons/person-management.spec.ts`

```typescript
import { test, expect } from '../../setup';

test.describe('Person Management Flow', () => {
  test('should add person to tree', async ({ authenticatedPage: page }) => {
    // Create or navigate to a tree first
    await page.goto('/trees/test-tree-id');

    // Click "Add Person" button
    await page.click('[data-testid="add-person-button"]');

    // Fill person form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="birthDate"]', '1990-01-01');
    await page.selectOption('select[name="gender"]', 'male');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show person in tree
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('should edit person details', async ({ authenticatedPage: page }) => {
    await page.goto('/trees/test-tree-id');

    // Click on person node
    await page.click('[data-testid="person-node-John"]');
    await page.click('text=Edit');

    // Update details
    await page.fill('input[name="name"]', 'John Smith');
    await page.click('button[type="submit"]');

    // Should show updated name
    await expect(page.locator('text=John Smith')).toBeVisible();
  });

  test('should delete person', async ({ authenticatedPage: page }) => {
    await page.goto('/trees/test-tree-id');

    // Click on person node
    await page.click('[data-testid="person-node-John"]');
    await page.click('text=Delete');

    // Confirm deletion
    await page.click('text=Confirm');

    // Person should be removed
    await expect(page.locator('text=John Smith')).not.toBeVisible();
  });

  test('should view person profile', async ({ authenticatedPage: page }) => {
    await page.goto('/trees/test-tree-id');

    // Click on person
    await page.click('[data-testid="person-node-John"]');

    // Should navigate to person profile
    await expect(page).toHaveURL(/\/trees\/.+\/persons\/.+/);
    await expect(page.locator('h1')).toContainText('John Doe');
  });
});
```

**Test 4: Create Relationships**
`tests/e2e/relationships/relationship-creation.spec.ts`

```typescript
import { test, expect } from '../../setup';

test.describe('Relationship Creation Flow', () => {
  test('should create parent-child relationship', async ({ authenticatedPage: page }) => {
    await page.goto('/trees/test-tree-id');

    // Add two persons first (if not exists)
    // Then create relationship

    // Click on first person, drag to second person
    await page.dragAndDrop(
      '[data-testid="person-node-father"]',
      '[data-testid="person-node-child]'
    );

    // Select relationship type
    await page.selectOption('select[name="relationshipType"]', 'parent-child');

    // Save relationship
    await page.click('button[type="submit"]');

    // Should show connection line
    await expect(page.locator('[data-testid="connection-line"]')).toBeVisible();
  });

  test('should create spouse relationship', async ({ authenticatedPage: page }) => {
    // Similar implementation
  });

  test('should edit relationship', async ({ authenticatedPage: page }) => {
    // Click on relationship line
    await page.click('[data-testid="connection-line"]');
    await page.click('text=Edit');

    // Change relationship type
    await page.selectOption('select[name="relationshipType"]', 'spouse');
    await page.click('button[type="submit"]');

    // Should update relationship
  });

  test('should delete relationship', async ({ authenticatedPage: page }) => {
    await page.click('[data-testid="connection-line"]');
    await page.click('text=Delete');
    await page.click('text=Confirm');

    // Connection should be removed
    await expect(page.locator('[data-testid="connection-line"]')).not.toBeVisible();
  });
});
```

**Test 5: Tree Visualization**
`tests/e2e/visualization/tree-view.spec.ts`

```typescript
import { test, expect } from '../../setup';

test.describe('Tree Visualization', () => {
  test('should display tree in vertical layout', async ({ authenticatedPage: page }) => {
    await page.goto('/trees/test-tree-id');

    // Should display tree canvas
    await expect(page.locator('[data-testid="tree-canvas"]')).toBeVisible();

    // Should display person nodes
    await expect(page.locator('[data-testid="person-node"]')).toHaveCount(3);
  });

  test('should switch to horizontal layout', async ({ authenticatedPage: page }) => {
    await page.goto('/trees/test-tree-id');

    // Click layout toggle
    await page.click('[data-testid="layout-toggle"]');
    await page.click('text=Horizontal');

    // Tree should re-render horizontally
    await expect(page.locator('[data-testid="tree-canvas"]')).toHaveClass(/horizontal/);
  });

  test('should zoom in/out', async ({ authenticatedPage: page }) => {
    await page.goto('/trees/test-tree-id');

    const canvas = page.locator('[data-testid="tree-canvas"]');

    // Zoom in
    await page.click('[data-testid="zoom-in"]');
    await expect(canvas).toHaveCSS('transform', /scale\(1\.2/);

    // Zoom out
    await page.click('[data-testid="zoom-out"]');
    await expect(canvas).toHaveCSS('transform', /scale\(0\.8/);
  });

  test('should pan the canvas', async ({ authenticatedPage: page }) => {
    await page.goto('/trees/test-tree-id');

    const canvas = page.locator('[data-testid="tree-canvas"]');
    const box = await canvas.boundingBox();

    // Drag canvas
    await page.mouse.move(box!.x + 100, box!.y + 100);
    await page.mouse.down();
    await page.mouse.move(box!.x + 200, box!.y + 200);
    await page.mouse.up();

    // Canvas should be moved
  });
});
```

**Test 6: Upload Photo**
`tests/e2e/media/photo-upload.spec.ts`

```typescript
import { test, expect } from '../../setup';

test.describe('Photo Upload Flow', () => {
  test('should upload photo for person', async ({ authenticatedPage: page }) => {
    await page.goto('/trees/test-tree-id/persons/person-id');

    // Click on photo upload
    await page.click('[data-testid="photo-upload"]');

    // Select file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/test-photo.jpg');

    // Wait for upload
    await page.waitForSelector('[data-testid="photo-success"]');

    // Should display uploaded photo
    await expect(page.locator('img[alt="Person photo"]')).toBeVisible();
  });

  test('should delete photo', async ({ authenticatedPage: page }) => {
    await page.goto('/trees/test-tree-id/persons/person-id');

    await page.click('[data-testid="photo-delete"]');
    await page.click('text=Confirm');

    // Photo should be removed
    await expect(page.locator('[data-testid="placeholder-avatar"]')).toBeVisible();
  });
});
```

**Test 7: Export Tree**
`tests/e2e/export/export-tree.spec.ts`

```typescript
import { test, expect } from '../../setup';

test.describe('Tree Export Flow', () => {
  test('should export tree as JSON', async ({ authenticatedPage: page }) => {
    await page.goto('/trees/test-tree-id');

    // Click export button
    await page.click('[data-testid="export-button"]');
    await page.click('text=Export as JSON');

    // Should trigger download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('text=Confirm'),
    ]);

    expect(download.suggestedFilename()).toMatch(/tree-.*\.json/);
  });

  test('should export tree as image', async ({ authenticatedPage: page }) => {
    await page.goto('/trees/test-tree-id');

    await page.click('[data-testid="export-button"]');
    await page.click('text=Export as Image');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('text=Confirm'),
    ]);

    expect(download.suggestedFilename()).toMatch(/tree-.*\.png/);
  });
});
```

**Test 8: User Settings**
`tests/e2e/settings/settings.spec.ts`

```typescript
import { test, expect } from '../../setup';

test.describe('User Settings Flow', () => {
  test('should update profile', async ({ authenticatedPage: page }) => {
    await page.goto('/settings');

    // Update profile
    await page.fill('input[name="name"]', 'Updated Name');
    await page.fill('textarea[name="bio"]', 'Updated bio');
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Profile updated')).toBeVisible();
  });

  test('should change password', async ({ authenticatedPage: page }) => {
    await page.goto('/settings');
    await page.click('text=Security');

    await page.fill('input[name="currentPassword"]', 'oldpassword');
    await page.fill('input[name="newPassword"]', 'newpassword123');
    await page.fill('input[name="confirmPassword"]', 'newpassword123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Password changed')).toBeVisible();
  });

  test('should update notification preferences', async ({ authenticatedPage: page }) => {
    await page.goto('/settings');
    await page.click('text=Notifications');

    await page.check('input[name="emailNotifications"]');
    await page.uncheck('input[name="pushNotifications"]');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Preferences saved')).toBeVisible();
  });
});
```

#### Step 1.4: Run and Debug Tests (1-2 hours)

**Run all E2E tests:**
```bash
npx playwright test
```

**Run with UI:**
```bash
npx playwright test --ui
```

**Run in debug mode:**
```bash
npx playwright test --debug
```

**Actions:**
1. Run all tests and identify failures
2. Debug and fix flaky tests
3. Add proper waits and assertions
4. Ensure tests are deterministic

---

## Part 2: Documentation (8-11 hours)

### Current State
- README.md is generic Next.js template
- No project-specific documentation
- No setup/deployment guides
- No API documentation

### Documentation Tasks

#### Step 2.1: Rewrite README.md (2-3 hours)

**File:** `README.md`

```markdown
# Family Tree Application

A modern web application for creating and managing family trees with visualization, collaboration, and media management features.

## Features

- **Family Tree Management**: Create, edit, and share family trees
- **Person Management**: Add family members with detailed profiles
- **Relationships**: Define parent-child, spouse, and sibling relationships
- **Visualization**: Multiple tree layout strategies (vertical, horizontal, timeline, fan chart)
- **Media Management**: Upload and associate photos with family members
- **Collaboration**: Share trees with family members
- **Authentication**: Email/password and OAuth (Google, Facebook)

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: MongoDB
- **Authentication**: NextAuth v5
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with shadcn/ui patterns
- **Testing**: Jest, Vitest, Playwright

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- MongoDB (local or Atlas cloud instance)
- Google/Facebook OAuth credentials (optional, for social login)

## Quick Start

### 1. Clone the repository

\`\`\`bash
git clone https://github.com/yourusername/family-tree.git
cd family-tree
\`\`\`

### 2. Install dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Set up environment variables

Create a \`.env.local\` file:

\`\`\`env
# Database
MONGODB_URI=mongodb://localhost:27017/family-tree

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
\`\`\`

### 4. Start the development server

\`\`\`bash
npm run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

\`\`\`
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard and settings pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── tree/             # Tree visualization components
│   ├── person/           # Person-related components
│   └── dashboard/        # Dashboard widgets
├── services/             # Business logic layer
├── repositories/         # Data access layer
├── models/              # MongoDB/Mongoose models
├── lib/                 # Utilities and DI container
├── strategies/          # Strategy pattern implementations
├── hooks/               # Custom React hooks
├── store/               # Zustand state management
└── types/               # TypeScript types
\`\`\`

## Architecture

This application follows **SOLID principles** and **layered architecture**:

1. **Presentation Layer**: Next.js pages and React components
2. **Service Layer**: Business logic and orchestration
3. **Repository Layer**: Data access abstraction
4. **Model Layer**: Database schemas

Key patterns:
- **Repository Pattern**: Clean data access
- **Service Layer Pattern**: Centralized business logic
- **Strategy Pattern**: Pluggable algorithms
- **Dependency Injection**: Loose coupling

## Development

### Running tests

\`\`\`bash
# Unit and integration tests
npm test

# E2E tests
npm run test:e2e

# Test with coverage
npm test -- --coverage
\`\`\`

### Building for production

\`\`\`bash
npm run build
npm start
\`\`\`

### Linting

\`\`\`bash
npm run lint
\`\`\`

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other platforms

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment guides.

## API Documentation

See [API.md](API.md) for API endpoint documentation.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see LICENSE file for details.
```

#### Step 2.2: Create Setup Guide (1-2 hours)

**File:** `docs/setup/SETUP.md`

```markdown
# Development Setup Guide

## Local Development Setup

### 1. Install MongoDB

#### Option A: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create a cluster (free tier)
4. Get connection string

#### Option B: Local MongoDB
**macOS:**
\`\`\`bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
\`\`\`

**Windows:**
Download and install from [MongoDB website](https://www.mongodb.com/try/download/community)

**Linux:**
\`\`\`bash
sudo apt-get install mongodb
\`\`\`

### 2. Install Node.js

Use [nvm](https://github.com/nvm-sh/nvm) for version management:

\`\`\`bash
nvm install 18
nvm use 18
\`\`\`

### 3. Configure Environment Variables

Copy the example env file:
\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit \`.env.local\` with your values.

### 4. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 5. Initialize Database

\`\`\`bash
npm run db:init
\`\`\`

This creates necessary indexes and initial data.

### 6. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

## OAuth Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: \`http://localhost:3000/api/auth/callback/google\`
6. Copy Client ID and Secret to \`.env.local\`

### Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new app
3. Add Facebook Login product
4. Add authorized redirect URI: \`http://localhost:3000/api/auth/callback/facebook\`
5. Copy App ID and Secret to \`.env.local\`

## Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB is running: \`mongosh\` or connect via Atlas
- Check connection string in \`.env.local\`
- Check firewall settings for Atlas

### NextAuth Issues
- Verify NEXTAUTH_SECRET is set (generate with \`openssl rand -base64 32\`)
- Check NEXTAUTH_URL matches your domain

### Build Errors
- Delete \`node_modules\` and \`next\` cache: \`rm -rf node_modules .next\`
- Reinstall: \`npm install\`
```

#### Step 2.3: Create Deployment Guide (2-3 hours)

**File:** `docs/deployment/DEPLOYMENT.md`

```markdown
# Deployment Guide

## Prerequisites

- MongoDB database (Atlas recommended)
- Hosting platform (Vercel, Netlify, or custom)
- Domain name (optional)
- OAuth credentials (for social login)

## Deploying to Vercel

### 1. Prepare for Deployment

1. Push code to GitHub
2. Ensure all environment variables are documented

### 2. Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Whitelist all IPs (0.0.0.0/0) for Vercel
4. Get connection string

### 3. Deploy on Vercel

1. Go to [Vercel](https://vercel.com)
2. Click "Import Project"
3. Connect your GitHub repository
4. Add environment variables:

\`\`\`
MONGODB_URI=mongodb+srv://...
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
\`\`\`

5. Click "Deploy"

### 4. Configure Custom Domain (Optional)

1. Go to project settings
2. Add custom domain
3. Update DNS records

## Deploying to Other Platforms

### Docker

\`\`\`dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
\`\`\`

### AWS

See detailed AWS deployment guide.

## Environment Variables Checklist

- [ ] MONGODB_URI
- [ ] NEXTAUTH_URL
- [ ] NEXTAUTH_SECRET
- [ ] GOOGLE_CLIENT_ID (optional)
- [ ] GOOGLE_CLIENT_SECRET (optional)
- [ ] FACEBOOK_CLIENT_ID (optional)
- [ ] FACEBOOK_CLIENT_SECRET (optional)
- [ ] SMTP_HOST (optional, for emails)
- [ ] SMTP_PORT (optional)
- [ ] SMTP_USER (optional)
- [ ] SMTP_PASSWORD (optional)

## Post-Deployment Checklist

- [ ] Test authentication flow
- [ ] Test tree creation
- [ ] Test person creation
- [ ] Test file uploads
- [ ] Verify OAuth callbacks
- [ ] Set up monitoring
- [ ] Configure backups
```

#### Step 2.4: Create API Documentation (2-3 hours)

**File:** `docs/api/API.md`

```markdown
# API Documentation

Base URL: \`https://yourdomain.com/api\`

## Authentication

Most endpoints require authentication via JWT token in Authorization header:

\`\`\`
Authorization: Bearer <token>
\`\`\`

## Trees API

### GET /api/trees

Get all trees for authenticated user.

**Response:**
\`\`\`json
{
  "id": "123",
  "name": "My Family Tree",
  "description": "...",
  "ownerId": "user123",
  "createdAt": "2024-01-01T00:00:00Z",
  "personCount": 25
}
\`\`\`

### POST /api/trees

Create a new tree.

**Request:**
\`\`\`json
{
  "name": "My Family Tree",
  "description": "A family tree"
}
\`\`\`

**Response:** 201 Created

### GET /api/trees/:id

Get tree by ID.

### PUT /api/trees/:id

Update tree.

### DELETE /api/trees/:id

Delete tree (cascades to persons and relationships).

## Persons API

### POST /api/persons

Create a person.

**Request:**
\`\`\`json
{
  "treeId": "tree123",
  "name": "John Doe",
  "birthDate": "1990-01-01",
  "deathDate": null,
  "gender": "male",
  "bio": "Born in New York"
}
\`\`\`

### GET /api/persons/:id

Get person by ID.

### PUT /api/persons/:id

Update person.

### DELETE /api/persons/:id

Delete person.

## Relationships API

### POST /api/relationships

Create relationship.

**Request:**
\`\`\`json
{
  "treeId": "tree123",
  "fromPersonId": "person1",
  "toPersonId": "person2",
  "type": "parent-child"
}
\`\`\`

## Media API

### POST /api/media/upload

Upload file.

**Request:** multipart/form-data

### DELETE /api/media/:id

Delete media.

## Dashboard API

### GET /api/dashboard

Get dashboard data (tree count, person count, recent activity).

## Error Responses

All endpoints may return:

- 400 Bad Request - Invalid input
- 401 Unauthorized - Not authenticated
- 403 Forbidden - No permission
- 404 Not Found - Resource not found
- 500 Internal Server Error - Server error
```

#### Step 2.5: Create Contributing Guide (1 hour)

**File:** `CONTRIBUTING.md`

```markdown
# Contributing to Family Tree

Thank you for your interest in contributing!

## How to Contribute

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature/amazing-feature\`
3. Make your changes
4. Write/update tests
5. Ensure tests pass: \`npm test\`
6. Commit with conventional commit message
7. Push to your fork
8. Create a pull request

## Code Style

- Use TypeScript for all code
- Follow SOLID principles
- Write tests for new features
- Use conventional commits
- Keep components small and focused

## Commit Convention

\`\`\`
feat: add person search feature
fix: resolve tree rendering bug
docs: update API documentation
test: add tests for TreeService
refactor: improve repository pattern
\`\`\`

## Testing

Before submitting PR:
- Run tests: \`npm test\`
- Run E2E tests: \`npm run test:e2e\`
- Check coverage: \`npm test -- --coverage\`
```

---

## Acceptance Criteria

### E2E Testing
- [ ] Playwright installed and configured
- [ ] Test fixtures created
- [ ] 8+ critical user journey tests written
- [ ] All E2E tests passing
- [ ] Tests run in CI/CD pipeline

### Documentation
- [ ] README.md rewritten with project-specific info
- [ ] Setup guide created
- [ ] Deployment guide created
- [ ] API documentation created
- [ ] Contributing guide created
- [ ] All documentation is clear and accurate

---

## Deliverables

1. **E2E Test Suite**
   - 8+ test files covering critical journeys
   - Test fixtures and helpers
   - Playwright configuration

2. **Documentation**
   - Updated README.md
   - Setup guide
   - Deployment guide
   - API documentation
   - Contributing guide

---

## Notes

- E2E tests should be stable and deterministic
- Use data-testid attributes for test selectors
- Document any manual testing requirements
- Keep documentation up to date as code changes

---

## Next Steps

After completing this task:
- Deploy to staging environment
- Conduct QA testing
- Gather user feedback
- Plan feature enhancements
