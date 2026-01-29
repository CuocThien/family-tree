# Contributing to Family Tree

Thank you for your interest in contributing!

## How to Contribute

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Write/update tests
5. Ensure tests pass: `npm test`
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

```
feat: add person search feature
fix: resolve tree rendering bug
docs: update API documentation
test: add tests for TreeService
refactor: improve repository pattern
```

## Testing

Before submitting PR:
- Run tests: `npm test`
- Run E2E tests: `npm run test:e2e`
- Check coverage: `npm test -- --coverage`

## Development Workflow

1. Create issue for bug/feature
2. Assign issue to yourself
3. Create branch from issue: `feature/issue-number-description`
4. Implement changes
5. Write tests
6. Run tests locally
7. Submit PR with issue reference

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # React components
├── services/               # Business logic layer
├── repositories/           # Data access layer
├── models/                 # MongoDB/Mongoose models
├── lib/                    # Utilities and DI container
├── strategies/             # Strategy pattern implementations
├── hooks/                  # Custom React hooks
├── store/                  # Zustand state management
└── types/                  # TypeScript types
```

## SOLID Principles Checklist

When implementing:
- [ ] Single Responsibility: Each class has one reason to change
- [ ] Open/Closed: Open for extension, closed for modification
- [ ] Liskov Substitution: Derived classes substitutable for base
- [ ] Interface Segregation: Focused interfaces, no fat interfaces
- [ ] Dependency Inversion: Depend on abstractions, not concretions
