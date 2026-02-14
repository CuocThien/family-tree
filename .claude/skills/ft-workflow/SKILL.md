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
    [SE] Implement (on feature branch)
       ↓
    [QC] Test
       ↓
   Bugs Found? → Yes → [SE] Fix → [QC] Re-test
       ↓ No
    [PM] Validate
       ↓
 Issues Found? → Yes → [SE] Fix → [QC] Re-test → [PM] Re-validate
       ↓ No
    [Commit & Create PR]
       ↓
    [PR Validation]
       ↓
 PR Issues? → Yes → [SE] Fix → [QC] Re-test → [PM] Re-validate
       ↓ No
    [Merge PR]
       ↓
    [Cleanup]
       ↓
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
1. Create feature branch with appropriate naming:
   ```bash
   git checkout -b <type>/<short-description>
   ```
   Branch types: `feature/`, `fix/`, `refactor/`, `test/`, `docs/`
2. Read and understand the specification
3. Create implementation plan
4. Implement following SOLID principles
5. Write unit and integration tests
6. Run build and tests

**Output:** Implemented feature with tests on feature branch

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

### Step 5: Commit and Create PR

After PM and QC approve:
1. Commit all changes with conventional commits format:
   ```bash
   git add <specific-files>
   git commit -m "feat: descriptive message"
   ```
   Note: Do not include AI-generated author lines or co-authored-by lines.

2. Push and create Pull Request:
   ```bash
   git push -u origin <branch-name>
   gh pr create --title "Task XX: <short-description>" --body "<pr-body>"
   ```

**PR Body Template:**
```markdown
## Summary
- Brief description of changes

## Test plan
- [ ] Tests added and passing
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project standards
- [ ] SOLID principles verified
- [ ] Security review passed
```

**Branch Naming Conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `test/` - Test additions
- `docs/` - Documentation updates

### Step 6: PR Validation

Review the PR for final validation:
1. Ensure all CI checks pass
2. Verify all acceptance criteria in PR description
3. Confirm no merge conflicts
4. Check code diff one final time

**If PR Issues Found:**
- Return to Step 2 (SE fixes issues)
- Go to Step 3 (QC re-tests)
- Return to Step 4 (PM re-validates)
- Return to Step 6 (PR re-validation)
- Loop until PR is approved

### Step 7: Merge PR

When PR is validated and approved:
```bash
gh pr merge --merge
```

This merges the feature branch into main.

### Step 8: Cleanup

After merge:
```bash
git checkout main
git pull
git branch -d <branch-name>
```

Delete the remote branch if not automatically deleted:
```bash
git push origin --delete <branch-name>  # if needed
```

### Step 9: Completion

When workflow fully completes:
1. Verify application builds and runs on main
2. Confirm feature works as specified in production
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
- [ ] PR created and validated (verified by PM)
- [ ] PR merged to main (verified by SE)
- [ ] Branch cleaned up (verified by SE)

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
- SE: Create feature branch
- SE: Implement feature
- SE: Write tests
- QC: Run automated tests
- QC: Manual testing
- QC: Regression testing
- PM: Architecture validation
- PM: Code quality validation
- SE: Commit changes
- SE: Create pull request
- PM: PR validation
- SE: Merge PR
- SE: Cleanup branch
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

### PR Fix Loop (PR → SE → QC → PM → PR)

```
while (PR validation finds issues) {
  SE fixes issues
  QC re-tests
  PM re-validates
  PR re-validation
}
```

Each iteration:
1. Update TodoWrite with "Fixing PR issue: [description]"
2. Invoke SE to fix specific issue
3. Invoke QC to re-test
4. Invoke PM to re-validate
5. Re-validate PR
6. Repeat until PR is approved

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

1. **Current Phase**: PM / SE / QC / PR / MERGE / COMPLETE
2. **Iteration Count**: How many fix cycles
3. **Pending Issues**: List of bugs/issues to fix
4. **Approval Status**: PM (pending/approved), QC (pending/approved), PR (pending/approved)
5. **Branch Name**: Current feature branch name

## Final Output

When workflow completes, provide:

```
## Workflow Complete: [Feature Name]

### Summary
- Requirement: [Original requirement]
- Specification: docs/specifications/[name].md
- Total iterations: [count]
- Duration: [start] to [end]
- Branch: [branch-name]
- PR: #[pr-number]

### Deliverables
- Technical specification
- Implemented feature
- Test coverage: [X]%
- QC report: .qc-reports/[name]-qc.md
- Merged PR: #[pr-number]

### Verification
- [x] All acceptance criteria met
- [x] All tests passing
- [x] Build successful
- [x] No regressions
- [x] Architecture approved
- [x] Code quality approved
- [x] PR created and validated
- [x] PR merged to main
- [x] Branch cleaned up

### Files Changed
- Created: [count] files
- Modified: [count] files

### Ready for Deployment
YES - Feature is complete, tested, and merged to main
```
