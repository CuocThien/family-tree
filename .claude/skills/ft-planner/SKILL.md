---
name: ft-planner
description: Plan new features, refactoring, or architectural changes for the Family Tree Next.js application. Use when: (1) User wants to add new features to the family tree app, (2) Planning refactoring that affects service/repository layers, (3) Making architectural decisions that impact the SOLID structure, (4) Deciding on new domain entities or relationships between existing ones, (5) Creating new services, repositories, or components.
---

# Family Tree Planner

## Planning Process

### 1. Analyze Requirements

1. Read existing architecture in `.claude/CLAUDE.md` and `README.md`
2. Identify which layers are affected:
   - **Presentation**: `src/components/`, `src/app/`
   - **Service**: `src/services/{domain}/`
   - **Repository**: `src/repositories/{implementation}/`
   - **Data**: `src/models/`

### 2. Check Existing Patterns

Before planning, investigate:
- Similar services in `src/services/` for reference
- Existing repositories in `src/repositories/`
- Related models in `src/models/`
- Component patterns in `src/components/`

### 3. Architecture Decision Template

For each feature, document:

```
Feature: [Name]

Layers Affected:
- [ ] Presentation (components/pages)
- [ ] Service (business logic)
- [ ] Repository (data access)
- [ ] Model (database schema)

Required Interfaces:
- I[Domain]Service
- I[Domain]Repository

New Files Needed:
- src/services/{domain}/I[Domain]Service.ts
- src/services/{domain}/[Domain]Service.ts
- src/repositories/interfaces/I[Domain]Repository.ts
- src/repositories/mongodb/[Domain]Repository.ts
- src/models/[Domain].ts
- src/types/{domain}.ts

SOLID Considerations:
- SRP: [description]
- OCP: [description]
- LSP: [description]
- ISP: [description]
- DIP: [description]
```

### 4. Layer-by-Layer Planning

#### Service Layer Planning
- Define interface first (`I[Domain]Service.ts`)
- Plan business logic methods
- Identify dependencies (other services, repositories)
- Plan error handling

#### Repository Layer Planning
- Define interface (`I[Domain]Repository.ts`)
- Plan CRUD operations
- Consider pagination, filtering
- Plan queries for related entities

#### Component Planning
- Identify reusable UI components
- Plan component composition
- Define props interfaces
- Plan state management approach

### 5. Output

Create a plan file in `.claude/plans/` with:
1. Feature description
2. File changes (new/modified)
3. Step-by-step implementation order
4. Dependencies between changes
5. Testing strategy

## Rules

- Always propose interfaces before implementations
- Consider existing SOLID patterns in the codebase
- Plan for testability (injectable dependencies)
- Avoid fat interfaces - use Interface Segregation
- Follow project naming conventions
