# Git Branch Naming Conventions

## Format

`<type>/<short-description>`

## Types

| Type | Usage | Example |
|------|-------|---------|
| `feature/` | New features | `feature/user-authentication` |
| `fix/` | Bug fixes | `fix/login-validation-error` |
| `refactor/` | Code refactoring without behavior change | `refactor/service-layer-abstraction` |
| `test/` | Adding or updating tests | `test/person-service-coverage` |
| `docs/` | Documentation updates | `docs/api-readme` |
| `perf/` | Performance improvements | `perf/database-query-optimization` |
| `style/` | Code style changes (formatting, etc.) | `style-eslint-rules` |
| `chore/` | Maintenance tasks, dependencies | `chore-upgrade-dependencies` |
| `ci/` | CI/CD configuration changes | `ci-github-actions-setup` |

## Guidelines

1. **Use lowercase** for type and description
2. **Use hyphens** to separate words in description
3. **Keep descriptions concise** (50 characters or less)
4. **Use imperative mood** (e.g., `add-user-auth`, not `adding-user-auth` or `user-auth-added`)
5. **Be descriptive** - the branch name should explain what it does

## Examples

Good:
```
feature/user-registration
fix/database-connection-leak
refactor/dependency-injection
test/person-service-integration
docs/api-endpoints
```

Bad:
```
feature  # No description
new-stuff  # Wrong type format
Feature/user-auth  # Uppercase type
feature/adding_the_user_authentication_module  # Too verbose, underscores
```

## Integration with Conventional Commits

Branch type should align with commit type:
- `feature/` → `feat:` commits
- `fix/` → `fix:` commits
- `refactor/` → `refactor:` commits
- etc.
