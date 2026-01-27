# Family Tree Project - Claude Instructions

This file contains project-specific instructions for Claude Code when working on the Family Tree application.

## Project Overview

A Next.js 14+ family tree web application with MongoDB, following SOLID principles and layered architecture.

## Architecture Summary

```
src/
├── app/                    # Next.js App Router (Presentation)
├── components/             # React components
├── services/               # Business Logic Layer
│   ├── person/
│   ├── tree/
│   ├── relationship/
│   └── ...
├── repositories/           # Data Access Layer
│   ├── interfaces/
│   └── mongodb/
├── models/                 # MongoDB/Mongoose models
├── lib/                    # Utilities & DI container
├── strategies/             # Strategy pattern implementations
└── types/                  # TypeScript types & DTOs
```

## Key Patterns

1. **Service Layer Pattern**: All business logic in `services/` with interfaces
2. **Repository Pattern**: Data access abstracted in `repositories/` with interfaces
3. **Dependency Injection**: All dependencies injected via constructor
4. **Strategy Pattern**: Visualization and storage strategies in `strategies/`

## Naming Conventions

- **Services**: `PersonService`, `TreeService` - PascalCase
- **Repositories**: `PersonRepository`, `TreeRepository` - PascalCase
- **Interfaces**: `IPersonService`, `IPersonRepository` - Prefix with `I`
- **Components**: `PersonCard`, `PersonForm` - PascalCase
- **Test files**: `*.test.ts`, `*.spec.ts` suffix

## File Locations

- Services: `src/services/{domain}/`
- Repositories: `src/repositories/{implementation}/`
- Models: `src/models/`
- Components: `src/components/{feature}/`
- API Routes: `src/app/api/{resource}/route.ts`
- Types: `src/types/`

## Testing Requirements

- Unit tests: `src/services/**/*.test.ts`
- Integration tests: `tests/integration/`
- E2E tests: `tests/e2e/`

## SOLID Principles Checklist

When implementing:
- [ ] Single Responsibility: Each class has one reason to change
- [ ] Open/Closed: Open for extension, closed for modification
- [ ] Liskov Substitution: Derived classes substitutable for base
- [ ] Interface Segregation: Focused interfaces, no fat interfaces
- [ ] Dependency Inversion: Depend on abstractions, not concretions
