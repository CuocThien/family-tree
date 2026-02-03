---
name: ft-workflow
description: Complete feature development workflow from requirement to delivery. Orchestrates PM (requirement analysis & documentation), SE (implementation), and QC (testing) agents with iterative feedback loops until the feature is complete and approved. Use when: (1) Developing new features from user requirements, (2) Implementing significant changes requiring thorough testing, (3) Ensuring quality through structured review process.
---

# Feature Development Workflow

Complete feature development workflow that orchestrates PM, SE, and QC agents from requirements to delivery.
## Available Agents Reference                                                                           

| Role | Agent | Purpose |
                                                                                                  
 |------|-------|---------|                                                                                                                            
 | PM | `ft-pm` | Analyze requirements, create specs, validate architecture |                                                           
 | SE | `ft-se` | Implement features, fix build errors |                                                                                
 | SE | `ft-se` | General implementation tasks |                                                                                             
 | QC | `ft-qc` | Run E2E tests, capture artifacts |                                                                                              
 | Review | `code-reviewer` | Review code quality |                                                                                                    
 | Test | `test-builder` | Create and run tests | 

## Input

User invokes via `/ft-workflow "<requirement-description>"`

The workflow takes a user requirement and manages it through to completion.

## Workflow Overview

```
User Requirement
       ↓
    [PM] Analyze & Document
       ↓
    [SE] Implement
       ↓
    [QC] Test
       ↓
   Bugs Found? → Yes → [SE] Fix → [QC] Re-test
       ↓ No
    [PM] Validate
       ↓
 Issues Found? → Yes → [SE] Fix → [QC] Re-test → [PM] Re-validate
       ↓ No
   [COMPLETE]
```

## Detailed Steps

### Step 1: PM Analyzes Requirements

Invoke PM agent to:
1. Analyze the user requirement
2. Clarify ambiguities
3. Identify edge cases
4. Create technical specification document

**Output:** Technical specification in `docs/specifications/[feature-name].md`

### Step 2: SE Implements Feature

Invoke SE agent with the specification to:
1. Read and understand the specification
2. Create implementation plan
3. Implement following SOLID principles
4. Write unit and integration tests
5. Run build and tests

**Output:** Implemented feature with tests

### Step 3: QC Tests Feature

Invoke QC agent with the specification to:
1. Run all automated tests
2. Build the application
3. Test acceptance criteria
4. Perform regression testing
5. Create QC report

**If Bugs Found:**
- Return to Step 2 (SE fixes bugs)
- Loop until QC approves

### Step 4: PM Validates Quality

Invoke PM agent to review:
1. Architecture compliance (SOLID)
2. Code quality standards
3. Feature completeness
4. Acceptance criteria met

**If Issues Found:**
- Return to Step 2 (SE fixes issues)
- Go to Step 3 (QC re-tests)
- Return to Step 4 (PM re-validates)
- Loop until PM approves

### Step 5: Completion

When PM and QC both approve:
1. Verify application builds and runs
2. Confirm feature works as specified
3. Confirm no regressions
4. Mark workflow complete

## Agent Communication

### PM → SE
PM provides:
- Technical specification document
- Acceptance criteria
- Architecture guidelines

### SE → QC
SE provides:
- Implemented code
- Test coverage
- Build status

### QC → SE (if bugs)
QC provides:
- Bug report with severity
- Steps to reproduce
- Expected vs actual behavior

### QC → PM (if approved)
QC provides:
- Test results
- Approval status

### PM → SE (if issues)
PM provides:
- Architecture concerns
- Code quality issues
- Required fixes

## Exit Criteria

Workflow is COMPLETE when:
- [ ] All acceptance criteria met (verified by QC)
- [ ] All tests passing (verified by QC)
- [ ] Build succeeds (verified by QC)
- [ ] No regressions detected (verified by QC)
- [ ] Architecture review passes (verified by PM)
- [ ] Code quality approved (verified by PM)
- [ ] Feature works as specified (verified by all)

## Running the Workflow

When user invokes `/ft-workflow`:

1. Create TodoWrite with all workflow steps
2. Mark each step in_progress as you start
3. Mark each step completed when done
4. Use Task tool to invoke agents sequentially

### Example TodoWrite

```
- PM: Analyze requirements
- PM: Create specification document
- SE: Implement feature
- SE: Write tests
- QC: Run automated tests
- QC: Manual testing
- QC: Regression testing
- PM: Architecture validation
- PM: Code quality validation
- Final verification
```

## Handling Loops

### Bug Fix Loop (QC → SE → QC)

```
while (QC finds bugs) {
  SE fixes bugs
  QC re-tests
}
```

Each iteration:
1. Update TodoWrite with "Fixing bug: [description]"
2. Invoke SE to fix specific bug
3. Invoke QC to verify fix
4. Repeat until QC approves

### Issue Fix Loop (PM → SE → QC → PM)

```
while (PM finds issues) {
  SE fixes issues
  QC re-tests
  PM re-validates
}
```

Each iteration:
1. Update TodoWrite with "Fixing issue: [description]"
2. Invoke SE to fix specific issue
3. Invoke QC to re-test
4. Invoke PM to re-validate
5. Repeat until PM approves

## File Structure

```
docs/specifications/
└── [feature-name].md          # Created by PM

src/
├── types/                     # Created/Modified by SE
├── services/                  # Created/Modified by SE
├── repositories/              # Created/Modified by SE
├── models/                    # Created/Modified by SE
├── components/                # Created/Modified by SE
└── app/                       # Created/Modified by SE

tests/
├── unit/                      # Created by SE
└── integration/               # Created by SE

.qc-reports/
└── [feature-name]-qc.md       # Created by QC
```

## Commands Reference

```bash
# User invokes workflow
/ft-workflow "Add user authentication with role-based access"

# Workflow runs automatically through all steps
```

## Workflow State Management

Keep track of workflow state:

1. **Current Phase**: PM / SE / QC / COMPLETE
2. **Iteration Count**: How many fix cycles
3. **Pending Issues**: List of bugs/issues to fix
4. **Approval Status**: PM (pending/approved), QC (pending/approved)

## Final Output

When workflow completes, provide:

```
## Workflow Complete: [Feature Name]

### Summary
- Requirement: [Original requirement]
- Specification: docs/specifications/[name].md
- Total iterations: [count]
- Duration: [start] to [end]

### Deliverables
- Technical specification
- Implemented feature
- Test coverage: [X]%
- QC report: .qc-reports/[name]-qc.md

### Verification
- [x] All acceptance criteria met
- [x] All tests passing
- [x] Build successful
- [x] No regressions
- [x] Architecture approved
- [x] Code quality approved

### Files Changed
- Created: [count] files
- Modified: [count] files

### Ready for Deployment
YES - Feature is complete and tested
```
