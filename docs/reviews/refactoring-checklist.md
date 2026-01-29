# Refactoring Checklist - Family Tree Application

**Date:** 2026-01-29
**Based on:** Code Review Report
**Purpose:** Detailed list of refactoring tasks with priorities and estimates

---

## Table of Contents

- [Critical Security Fixes (Week 1)](#critical-security-fixes-week-1)
- [Critical Performance Fixes (Week 1)](#critical-performance-fixes-week-1)
- [High Priority Security (Week 2-3)](#high-priority-security-week-2-3)
- [Code Quality Improvements (Week 3-4)](#code-quality-improvements-week-3-4)
- [Performance Optimizations (Week 4-5)](#performance-optimizations-week-4-5)
- [Next.js Best Practices (Week 5-6)](#nextjs-best-practices-week-5-6)
- [Architecture Refactoring (Week 7-8)](#architecture-refactoring-week-7-8)
- [Documentation (Week 8)](#documentation-week-8)

---

## Critical Security Fixes (Week 1)

### C1: Change Default Secrets
**Priority:** CRITICAL
**Estimated Time:** 1 hour
**Files:** `.env.local`, `src/lib/config/env.ts`

**Tasks:**
- [ ] Generate cryptographically secure NEXTAUTH_SECRET
- [ ] Generate cryptographically secure FILE_SIGNING_SECRET
- [ ] Remove default values from env.ts
- [ ] Add environment-specific validation
- [ ] Update deployment documentation

**Dependencies:** None

**Acceptance:**
- No default secrets in code
- Application fails startup if secrets not set

---

### C2: Implement Login Rate Limiting
**Priority:** CRITICAL
**Estimated Time:** 2 hours
**Files:** `src/lib/auth.ts`, `src/lib/rateLimit.ts`

**Tasks:**
- [ ] Apply rate limit to Credentials provider
- [ ] Implement account lockout after 5 failed attempts
- [ ] Add CAPTCHA after 3 failed attempts
- [ ] Add rate limit headers to response
- [ ] Write tests for rate limiting

**Dependencies:** None

**Acceptance:**
- Login endpoint rate limited
- Account lockout functional
- Tests passing

---

### C3: Fix NoSQL Injection in Search
**Priority:** CRITICAL
**Estimated Time:** 3 hours
**Files:** `src/repositories/mongodb/PersonRepository.ts`

**Tasks:**
- [ ] Sanitize regex special characters in search
- [ ] Implement allowlist for special characters
- [ ] Add query complexity limits
- [ ] Write security tests for injection attempts
- [ ] Add documentation on safe search patterns

**Dependencies:** None

**Acceptance:**
- Regex metacharacters sanitized
- Security tests passing
- No injection vulnerabilities

---

### C4: Implement File Content Validation
**Priority:** CRITICAL
**Estimated Time:** 4 hours
**Files:** `src/app/api/media/route.ts`

**Tasks:**
- [ ] Install `file-type` package
- [ ] Implement magic byte detection
- [ ] Validate file structure for images
- [ ] Add malware scanning (basic)
- [ ] Write tests for file validation

**Dependencies:** None

**Acceptance:**
- File content validated, not just MIME type
- Malicious files rejected
- Tests passing

---

### C5: Sanitize Error Messages
**Priority:** CRITICAL
**Estimated Time:** 2 hours
**Files:** `src/app/api/error.ts`

**Tasks:**
- [ ] Sanitize error messages before logging
- [ ] Implement structured logging with filtering
- [ ] Use error codes in production
- [ ] Disable debug mode in production
- [ ] Add error logging tests

**Dependencies:** None

**Acceptance:**
- No stack traces in production logs
- Sensitive data filtered
- Tests passing

---

### C6: Remove Password from API Responses
**Priority:** CRITICAL
**Estimated Time:** 1 hour
**Files:** `src/repositories/mongodb/UserRepository.ts`

**Tasks:**
- [ ] Remove password from returned entity
- [ ] Create separate authentication DTO
- [ ] Add audit logging for password field access
- [ ] Write tests to verify password never exposed

**Dependencies:** None

**Acceptance:**
- Password never in API responses
- Audit logging functional
- Tests passing

---

## Critical Performance Fixes (Week 1)

### P1: Fix Dashboard N+1 Query
**Priority:** CRITICAL
**Estimated Time:** 4 hours
**Files:** `src/app/api/dashboard/route.ts`

**Tasks:**
- [ ] Create aggregation pipeline for tree stats
- [ ] Replace sequential getTreeStats calls
- [ ] Add performance tests
- [ ] Verify improvement (target: < 500ms)

**Dependencies:** None

**Acceptance:**
- Single database query for dashboard
- Load time < 500ms
- Tests passing

---

### P2: Add Database Indexes
**Priority:** CRITICAL
**Estimated Time:** 3 hours
**Files:** `src/models/User.ts`, `src/models/Person.ts`, `src/models/Relationship.ts`

**Tasks:**
- [ ] Add index on User.email (explicit)
- [ ] Add index on User.isVerified
- [ ] Add compound index on User.resetPasswordToken + resetPasswordExpiry
- [ ] Add compound index on User.verificationToken + verificationTokenExpiry
- [ ] Add index on Person.gender
- [ ] Add compound index for Person search patterns
- [ ] Add indexes for Relationship.person1Id and person2Id
- [ ] Create migration script
- [ ] Test query performance improvements

**Dependencies:** None

**Acceptance:**
- All indexes created
- Query performance improved 10-100x
- Migration tested

---

### P3: Fix Avatar Component React Import
**Priority:** CRITICAL
**Estimated Time:** 15 minutes
**Files:** `src/components/ui/Avatar.tsx`

**Tasks:**
- [ ] Move React import to top of file
- [ ] Test component renders correctly

**Dependencies:** None

**Acceptance:**
- Component renders without errors
- No runtime errors

---

### P4: Implement Query Projections
**Priority:** CRITICAL
**Estimated Time:** 4 hours
**Files:** All repository files

**Tasks:**
- [ ] Add projections to PersonRepository queries
- [ ] Add projections to TreeRepository queries
- [ ] Add projections to RelationshipRepository queries
- [ ] Measure data transfer reduction
- [ ] Update tests

**Dependencies:** None

**Acceptance:**
- 30-50% reduction in data transfer
- All tests passing
- No missing fields in responses

---

### P5: Fix Ancestor/Descendant N+1 Queries
**Priority:** CRITICAL
**Estimated Time:** 6 hours
**Files:** `src/services/relationship/RelationshipService.ts`

**Tasks:**
- [ ] Rewrite getAncestors to use batch queries
- [ ] Rewrite getDescendants to use batch queries
- [ ] Add performance tests
- [ ] Verify improvement

**Dependencies:** None

**Acceptance:**
- Single database query per operation
- Performance improved 100x
- Tests passing

---

## High Priority Security (Week 2-3)

### H1: Reduce Session Expiry
**Priority:** HIGH
**Estimated Time:** 1 hour
**Files:** `src/lib/auth.ts`

**Tasks:**
- [ ] Reduce maxAge to 7 days
- [ ] Implement sliding session expiration
- [ ] Add "remember me" option with 24-hour default
- [ ] Update tests

**Dependencies:** None

**Acceptance:**
- Session expiry 7 days
- Sliding expiration functional
- Tests passing

---

### H2: Implement CSRF Protection
**Priority:** HIGH
**Estimated Time:** 4 hours
**Files:** `src/middleware.ts` or new file

**Tasks:**
- [ ] Implement CSRF token generation
- [ ] Add CSRF validation to mutation endpoints
- [ ] Configure NextAuth CSRF protection
- [ ] Add Origin and Referer header validation
- [ ] Write tests

**Dependencies:** None

**Acceptance:**
- CSRF protection on all mutations
- Tests passing
- No regressions

---

### H3: Strengthen Password Requirements
**Priority:** HIGH
**Estimated Time:** 2 hours
**Files:** `src/lib/auth/passwordValidation.ts`

**Tasks:**
- [ ] Increase minimum to 12 characters
- [ ] Require special characters
- [ ] Implement password strength meter
- [ ] Check against common passwords
- [ ] Update frontend validation
- [ ] Update tests

**Dependencies:** None

**Acceptance:**
- 12 character minimum
- Special characters required
- Strength meter functional
- Tests passing

---

### H4: Add Email Verification for Changes
**Priority:** HIGH
**Estimated Time:** 6 hours
**Files:** `src/app/api/user/profile/route.ts`

**Tasks:**
- [ ] Implement email verification flow
- [ ] Send confirmation to both old and new addresses
- [ ] Implement cooldown period
- [ ] Add tests
- [ ] Update frontend

**Dependencies:** EmailService must be implemented

**Acceptance:**
- Email changes require verification
- Both addresses notified
- Tests passing

---

### H5: Implement File Size Quotas
**Priority:** HIGH
**Estimated Time:** 4 hours
**Files:** `src/app/api/media/route.ts`

**Tasks:**
- [ ] Reduce image limit to 10MB
- [ ] Implement per-user storage quotas
- [ ] Add global upload rate limiting
- [ ] Implement image compression
- [ ] Add quota management UI
- [ ] Write tests

**Dependencies:** None

**Acceptance:**
- 10MB limit per file
- Per-user quotas enforced
- Compression functional
- Tests passing

---

### H6: Sanitize HTML in Biography
**Priority:** HIGH
**Estimated Time:** 3 hours
**Files:** `src/services/person/PersonService.ts`

**Tasks:**
- [ ] Install DOMPurify or sanitize-html
- [ ] Implement HTML sanitization
- [ ] Strip all script tags
- [ ] Implement CSP headers
- [ ] Write XSS tests
- [ ] Update frontend

**Dependencies:** None

**Acceptance:**
- HTML sanitized on input
- CSP headers implemented
- XSS tests passing

---

### H7: Validate Avatar URLs Strictly
**Priority:** HIGH
**Estimated Time:** 2 hours
**Files:** `src/app/api/user/profile/route.ts`

**Tasks:**
- [ ] Implement strict URL validation (http/https only)
- [ ] Add domain allowlist
- [ ] Implement avatar proxy
- [ ] Write tests

**Dependencies:** None

**Acceptance:**
- Only http/https URLs accepted
- Domain allowlist enforced
- Tests passing

---

### H8: Implement Response DTOs
**Priority:** HIGH
**Estimated Time:** 8 hours
**Files:** Multiple API routes

**Tasks:**
- [ ] Create DTOs for all entity types
- [ ] Update API routes to use DTOs
- [ ] Add field-level permission checks
- [ ] Write tests
- [ ] Update frontend if needed

**Dependencies:** None

**Acceptance:**
- Internal data not exposed
- DTOs used consistently
- Tests passing

---

### H9: Add Search Rate Limiting
**Priority:** HIGH
**Estimated Time:** 2 hours
**Files:** `src/app/api/search/route.ts`

**Tasks:**
- [ ] Apply rate limiting to search endpoint
- [ ] Implement minimum query length (3 chars)
- [ ] Add search result rate limiting
- [ ] Log suspicious patterns
- [ ] Write tests

**Dependencies:** None

**Acceptance:**
- Rate limiting enforced
- Minimum length enforced
- Tests passing

---

## Code Quality Improvements (Week 3-4)

### Q1: Replace String Matching with Custom Error Classes
**Priority:** HIGH
**Estimated Time:** 6 hours
**Files:** All API routes (15+ files)

**Tasks:**
- [ ] Update all API routes to use instanceof checks
- [ ] Verify all error paths tested
- [ ] Update error documentation

**Dependencies:** None

**Acceptance:**
- No string matching in error handling
- Custom error classes used
- All tests passing

---

### Q2: Update Repositories to Throw Custom Errors
**Priority:** HIGH
**Estimated Time:** 4 hours
**Files:** All repository files

**Tasks:**
- [ ] Import custom error classes
- [ ] Replace generic Error with NotFoundError
- [ ] Replace generic Error with ValidationError
- [ ] Update tests
- [ ] Update error documentation

**Dependencies:** Q1

**Acceptance:**
- No generic Error throws
- Custom errors used consistently
- Tests passing

---

### Q3: Create Centralized Error Handling Middleware
**Priority:** HIGH
**Estimated Time:** 4 hours
**Files:** New `src/lib/api/withErrorHandling.ts`

**Tasks:**
- [ ] Create higher-order function for error handling
- [ ] Apply to all API routes
- [ ] Add error logging
- [ ] Write tests
- [ ] Update documentation

**Dependencies:** Q1, Q2

**Acceptance:**
- Centralized error handling functional
- Duplicate code removed
- Tests passing

---

### Q4: Remove `any` Types from Repositories
**Priority:** MEDIUM
**Estimated Time:** 3 hours
**Files:** All repository files

**Tasks:**
- [ ] Create document type interfaces
- [ ] Replace all `any` types
- [ ] Update toEntity methods
- [ ] Verify TypeScript compilation
- [ ] Update tests

**Dependencies:** None

**Acceptance:**
- No `any` types in repositories
- TypeScript strict mode passing
- Tests passing

---

### Q5: Create Shared Sanitization Utilities
**Priority:** MEDIUM
**Estimated Time:** 3 hours
**Files:** New `src/lib/utils/sanitization.ts`

**Tasks:**
- [ ] Create sanitizeString utility
- [ ] Create sanitizePersonData utility
- [ ] Update all services to use utilities
- [ ] Write tests
- [ ] Update documentation

**Dependencies:** None

**Acceptance:**
- Sanitization centralized
- No duplicate code
- Tests passing

---

### Q6: Extract Date Validation to Shared Utilities
**Priority:** MEDIUM
**Estimated Time:** 2 hours
**Files:** New `src/lib/validation/dateValidation.ts`

**Tasks:**
- [ ] Create dateRangeRefinement for Zod
- [ ] Update DTOs to use shared refinement
- [ ] Remove duplicate validation
- [ ] Write tests

**Dependencies:** None

**Acceptance:**
- Date validation centralized
- No duplicate code
- Tests passing

---

### Q7: Add JSDoc to Service Methods
**Priority:** MEDIUM
**Estimated Time:** 8 hours
**Files:** All service files

**Tasks:**
- [ ] Add JSDoc to PersonService methods
- [ ] Add JSDoc to TreeService methods
- [ ] Add JSDoc to RelationshipService methods
- [ ] Add JSDoc to AuthService methods
- [ ] Add JSDoc to other services
- [ ] Generate documentation

**Dependencies:** None

**Acceptance:**
- All public methods documented
- Documentation generated
- No missing JSDoc

---

### Q8: Document Complex Algorithms
**Priority:** MEDIUM
**Estimated Time:** 4 hours
**Files:** `src/services/tree/TreeService.ts`

**Tasks:**
- [ ] Add comments to calculateGenerations
- [ ] Document BFS algorithm
- [ ] Add examples
- [ ] Update inline comments

**Dependencies:** None

**Acceptance:**
- Complex algorithms documented
- Comments clear and helpful

---

## Performance Optimizations (Week 4-5)

### Perf1: Implement Tree Virtualization
**Priority:** HIGH
**Estimated Time:** 12 hours
**Files:** `src/components/tree/TreeCanvas.tsx`

**Tasks:**
- [ ] Research virtualization libraries
- [ ] Implement viewport-based rendering
- [ ] Add incremental layout updates
- [ ] Test with large trees (1000+ nodes)
- [ ] Update documentation

**Dependencies:** None

**Acceptance:**
- Trees with 5000+ nodes render smoothly
- No performance degradation
- Tests passing

---

### Perf2: Implement Distributed Caching
**Priority:** HIGH
**Estimated Time:** 10 hours
**Files:** Multiple

**Tasks:**
- [ ] Set up Redis (Upstash or self-hosted)
- [ ] Create Redis client wrapper
- [ ] Update permission cache to use Redis
- [ ] Add caching for tree metadata
- [ ] Add caching for frequently accessed persons
- [ ] Implement cache invalidation
- [ ] Write tests
- [ ] Update deployment

**Dependencies:** None

**Acceptance:**
- Redis caching functional
- Cache invalidation working
- Tests passing
- Deployment updated

---

### Perf3: Add Pagination to All List Endpoints
**Priority:** HIGH
**Estimated Time:** 6 hours
**Files:** Multiple repository and API files

**Tasks:**
- [ ] Add pagination to PersonRepository
- [ ] Add pagination to TreeRepository
- [ ] Add pagination to RelationshipRepository
- [ ] Update API routes
- [ ] Update frontend to use pagination
- [ ] Write tests

**Dependencies:** None

**Acceptance:**
- All list endpoints paginated
- Frontend using pagination
- Tests passing

---

### Perf4: Implement Batch Operations
**Priority:** MEDIUM
**Estimated Time:** 6 hours
**Files:** `src/services/tree/TreeService.ts`

**Tasks:**
- [ ] Replace sequential inserts with insertMany
- [ ] Update import functionality
- [ ] Add error handling for batch operations
- [ ] Write tests
- [ ] Measure performance improvement

**Dependencies:** None

**Acceptance:**
- Batch operations implemented
- Performance improved
- Tests passing

---

### Perf5: Add Rate Limiting to All Public Endpoints
**Priority:** MEDIUM
**Estimated Time:** 4 hours
**Files:** Multiple API routes

**Tasks:**
- [ ] Apply rate limiting to search
- [ ] Apply rate limiting to export
- [ ] Apply rate limiting to dashboard
- [ ] Add rate limit headers
- [ ] Write tests

**Dependencies:** None

**Acceptance:**
- All public endpoints rate limited
- Headers present
- Tests passing

---

### Perf6: Add Response Compression
**Priority:** MEDIUM
**Estimated Time:** 2 hours
**Files:** `next.config.ts`

**Tasks:**
- [ ] Enable compression in Next.js config
- [ ] Test with large responses
- [ ] Measure compression ratio

**Dependencies:** None

**Acceptance:**
- Compression enabled
- Large responses compressed
- No regressions

---

### Perf7: Add API Response Caching Headers
**Priority:** MEDIUM
**Estimated Time:** 3 hours
**Files:** Multiple API routes

**Tasks:**
- [ ] Add cache headers to GET endpoints
- [ ] Configure appropriate TTLs
- [ ] Add stale-while-revalidate
- [ ] Write tests

**Dependencies:** None

**Acceptance:**
- Cache headers present
- Appropriate TTLs
- Tests passing

---

## Next.js Best Practices (Week 5-6)

### N1: Add Dynamic Imports
**Priority:** MEDIUM
**Estimated Time:** 6 hours
**Files:** Multiple component files

**Tasks:**
- [ ] Dynamic import ReactFlow/TreeCanvas
- [ ] Add loading skeletons
- [ ] Dynamic import other heavy components
- [ ] Test bundle size reduction
- [ ] Measure load time improvement

**Dependencies:** None

**Acceptance:**
- Large components dynamically imported
- Bundle size reduced
- Load times improved

---

### N2: Implement next/image Optimization
**Priority:** MEDIUM
**Estimated Time:** 4 hours
**Files:** `src/components/ui/Avatar.tsx`, others

**Tasks:**
- [ ] Replace img with next/image in Avatar
- [ ] Replace img with next/image elsewhere
- [ ] Configure image domains
- [ ] Test image optimization
- [ ] Update documentation

**Dependencies:** None

**Acceptance:**
- All images use next/image
- Automatic optimization functional
- No regressions

---

### N3: Add React.memo to Expensive Components
**Priority:** MEDIUM
**Estimated Time:** 4 hours
**Files:** Multiple component files

**Tasks:**
- [ ] Add React.memo to PersonNode
- [ ] Add React.memo to PersonCard
- [ ] Add React.memo to TreeGrid
- [ ] Implement proper comparison functions
- [ ] Test re-render reduction

**Dependencies:** None

**Acceptance:**
- Expensive components memoized
- Unnecessary re-renders eliminated
- Tests passing

---

### N4: Implement Lazy Loading for Routes
**Priority:** MEDIUM
**Estimated Time:** 4 hours
**Files:** Multiple route files

**Tasks:**
- [ ] Lazy load settings route
- [ ] Lazy load profile route
- [ ] Add loading skeletons
- [ ] Test navigation

**Dependencies:** None

**Acceptance:**
- Non-critical routes lazy loaded
- Loading states present
- No regressions

---

### N5: Add Error Boundaries
**Priority:** MEDIUM
**Estimated Time:** 6 hours
**Files:** New components

**Tasks:**
- [ ] Create ErrorBoundary component
- [ ] Add to major features (Dashboard, Tree Board, Person Profile)
- [ ] Add error reporting
- [ ] Add fallback UIs
- [ ] Write tests

**Dependencies:** None

**Acceptance:**
- Error boundaries implemented
- Errors caught gracefully
- Tests passing

---

### N6: Implement React Query Configuration
**Priority:** LOW
**Estimated Time:** 2 hours
**Files:** New or existing provider file

**Tasks:**
- [ ] Configure QueryClient
- [ ] Set default staleTime
- [ ] Set cache limits
- [ ] Add global error handling

**Dependencies:** None

**Acceptance:**
- QueryClient configured
- Sensible defaults
- Tests passing

---

### N7: Pre-fetch Data in Server Components
**Priority:** MEDIUM
**Estimated Time:** 6 hours
**Files:** Multiple page files

**Tasks:**
- [ ] Update Dashboard to pre-fetch data
- [ ] Update person profile page
- [ ] Pass data to client components
- [ ] Remove client-side fetching
- [ ] Measure performance improvement

**Dependencies:** None

**Acceptance:**
- Data pre-fetched server-side
- Faster initial page load
- Tests passing

---

### N8: Optimize Search with Text Indexes
**Priority:** LOW
**Estimated Time:** 4 hours
**Files:** `src/models/Person.ts`, `src/repositories/mongodb/PersonRepository.ts`

**Tasks:**
- [ ] Create MongoDB text index
- [ ] Update search to use $text
- [ ] Add search relevance scoring
- [ ] Write tests
- [ ] Measure performance

**Dependencies:** None

**Acceptance:**
- Text index created
- Search using $text operator
- Performance improved

---

## Architecture Refactoring (Week 7-8)

### A1: Split TreeService
**Priority:** MEDIUM
**Estimated Time:** 12 hours
**Files:** `src/services/tree/`

**Tasks:**
- [ ] Create TreeStatisticsService
- [ ] Create TreeExportService
- [ ] Create TreeVisualizationService
- [ ] Update TreeService to use new services
- [ ] Update DI container
- [ ] Update tests
- [ ] Update documentation

**Dependencies:** None

**Acceptance:**
- TreeService split complete
- Each service focused
- Tests passing
- Documentation updated

---

### A2: Split ITreeService Interface
**Priority:** MEDIUM
**Estimated Time:** 4 hours
**Files:** `src/services/tree/ITreeService.ts`

**Tasks:**
- [ ] Create ITreeStatisticsService
- [ ] Create ITreeExportService
- [ ] Create ITreeVisualizationService
- [ ] Update implementations
- [ ] Update DI container

**Dependencies:** A1

**Acceptance:**
- Interface split complete
- Implementations updated
- Tests passing

---

### A3: Extract Person Utility Methods
**Priority:** LOW
**Estimated Time:** 3 hours
**Files:** `src/services/person/PersonService.ts`

**Tasks:**
- [ ] Create PersonUtils helper
- [ ] Move utility methods
- [ ] Update PersonService
- [ ] Write tests
- [ ] Update documentation

**Dependencies:** None

**Acceptance:**
- Utility methods extracted
- Tests passing
- Documentation updated

---

### A4: Extract PermissionService Helper Methods
**Priority:** LOW
**Estimated Time:** 2 hours
**Files:** `src/services/permission/PermissionService.ts`

**Tasks:**
- [ ] Create PermissionHelper
- [ ] Move helper methods
- [ ] Update PermissionService
- [ ] Write tests

**Dependencies:** None

**Acceptance:**
- Helper methods extracted
- Tests passing

---

### A5: Implement Audit Log Archiving
**Priority:** MEDIUM
**Estimated Time:** 6 hours
**Files:** `src/repositories/mongodb/AuditRepository.ts`

**Tasks:**
- [ ] Create scheduled job for archiving
- [ ] Implement archive function
- [ ] Add archive configuration
- [ ] Write tests
- [ ] Update documentation

**Dependencies:** None

**Acceptance:**
- Archive job functional
- Old logs archived
- Tests passing

---

## Documentation (Week 8)

### D1: Add JSDoc to TypeScript Types
**Priority:** LOW
**Estimated Time:** 4 hours
**Files:** `src/types/`

**Tasks:**
- [ ] Add JSDoc to IPerson
- [ ] Add JSDoc to ITree
- [ ] Add JSDoc to IRelationship
- [ ] Add JSDoc to other types
- [ ] Generate documentation

**Dependencies:** None

**Acceptance:**
- All types documented
- Documentation generated

---

### D2: Extract Magic Numbers to Constants
**Priority:** LOW
**Estimated Time:** 2 hours
**Files:** Multiple files

**Tasks:**
- [ ] Create constants file
- [ ] Extract magic numbers
- [ ] Update references
- [ ] Write tests

**Dependencies:** None

**Acceptance:**
- Magic numbers extracted
- Tests passing

---

### D3: Update API Documentation
**Priority:** LOW
**Estimated Time:** 6 hours
**Files:** `docs/api/`

**Tasks:**
- [ ] Document all API endpoints
- [ ] Add request/response examples
- [ ] Document authentication
- [ ] Document error codes
- [ ] Generate OpenAPI spec

**Dependencies:** None

**Acceptance:**
- API documentation complete
- OpenAPI spec generated

---

### D4: Create Developer Guide
**Priority:** LOW
**Estimated Time:** 8 hours
**Files:** `docs/guides/`

**Tasks:**
- [ ] Create getting started guide
- [ ] Create architecture guide
- [ ] Create contribution guide
- [ ] Create deployment guide
- [ ] Create troubleshooting guide

**Dependencies:** None

**Acceptance:**
- Developer guide complete
- All sections present

---

## Summary Statistics

**Total Tasks:** 115+
**Total Estimated Time:** 200-250 hours
**Recommended Timeline:** 8 weeks

### Breakdown by Category

| Category | Tasks | Time | Week |
|----------|-------|------|------|
| Critical Security | 6 | 13 hours | 1 |
| Critical Performance | 5 | 19 hours | 1 |
| High Priority Security | 9 | 35 hours | 2-3 |
| Code Quality | 8 | 38 hours | 3-4 |
| Performance | 7 | 43 hours | 4-5 |
| Next.js Best Practices | 8 | 38 hours | 5-6 |
| Architecture | 5 | 29 hours | 7-8 |
| Documentation | 4 | 20 hours | 8 |

---

## Dependency Graph

```
Week 1 (Critical)
├── C1, C2, C3, C4, C5, C6 (Security)
├── P1, P2, P3, P4, P5 (Performance)
└── No dependencies

Week 2-3 (High Priority Security)
├── H1-H9 (can be done in parallel)
└── Dependencies: H4 requires EmailService

Week 3-4 (Code Quality)
├── Q1 → Q2 → Q3 (must be sequential)
├── Q4, Q5, Q6 (can be parallel)
└── Q7, Q8 (can be parallel with above)

Week 4-5 (Performance)
├── Perf1, Perf2, Perf3 (can be parallel)
├── Perf4, Perf5, Perf6, Perf7 (can be parallel)
└── Dependencies: None

Week 5-6 (Next.js)
├── N1-N8 (mostly parallel)
└── Dependencies: N7 may require N1

Week 7-8 (Architecture)
├── A1 → A2 (sequential)
├── A3, A4, A5 (can be parallel)
└── Dependencies: A2 requires A1

Week 8 (Documentation)
└── D1-D4 (can be parallel)
```

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Breaking changes | High | Medium | Comprehensive tests, incremental rollout |
| Performance regression | Medium | Low | Performance tests, benchmarks |
| Security regressions | High | Low | Security tests, code review |
| Timeline overrun | Medium | Medium | Buffer time, prioritize critical items |

---

**Checklist Version:** 1.0
**Last Updated:** 2026-01-29
**Next Review:** After Week 4 deliverables
