---
description: Execute complete implementation phase from plan document to PR. Use with path to plan file to implement tasks, review code, write tests, and create PR.
---

# Implement Command

This command executes the complete implementation workflow from a plan document to a merged pull request.

## What This Command Does

1. **Reads Plan Document** - Parses the implementation plan from the provided file
2. **Creates Git Branch** - Creates a feature branch with proper naming convention
3. **Implements Tasks** - Executes all tasks from the plan systematically
4. **Code Review** - Performs code and architecture review
5. **Write Tests** - Creates and runs unit/integration/e2e tests
6. **Creates PR** - Creates pull request to main branch
7. **Merges PR** - Reviews and merges the PR
8. **Cleanup** - Returns to main and deletes feature branch

## When to Use

Use `/implement <path-to-plan-file>` when:
- You have a written implementation plan ready to execute
- You want complete automation from plan to merged PR
- You need proper git workflow with branch creation
- You want code review and testing included

## How It Works

The implementer agent will:
1. Read the plan file to understand requirements
2. Determine task type (feature, fix, refactor, etc.)
3. Create appropriately named git branch
4. Implement all tasks with TodoWrite tracking
5. Review code against SOLID principles
6. Write and execute tests
7. Create comprehensive PR
8. Merge and cleanup

## Example Usage

```
User: /implement docs/plans/user-authentication.md

Agent (implementer):
Reading plan from docs/plans/user-authentication.md...

# Implementation: User Authentication

## Plan Summary
- Add JWT authentication
- Create login/register endpoints
- Implement session management

## Creating Branch
feature/user-authentication

## Tasks (8)
1. Create auth service interface
2. Implement JWT service
3. Create login API endpoint
4. Create register API endpoint
5. Add middleware for protected routes
6. Write unit tests
7. Write integration tests
8. Create PR

[Proceeds with implementation...]
```

## Important Notes

**PREREQUISITE**: You must have a plan document ready before using this command. Use `/plan` first if needed.

The implementer will:
- Use TodoWrite to track all tasks
- Follow git branch naming conventions
- Use conventional commits
- Ensure all tests pass before PR
- Review against SOLID principles
- NOT proceed without explicit confirmation at critical steps

## Related Commands

Before implementing:
- Use `/plan` to create the implementation plan
- Use `/brainstorm` to explore approaches

After implementing:
- Use `/code-review` for additional review
- Use `/test` to run tests again

## Related Skills

This command invokes the `implement` skill located at:
`~/.claude/skills/implement/SKILL.md`
