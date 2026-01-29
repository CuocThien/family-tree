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

```bash
git clone https://github.com/yourusername/family-tree.git
cd family-tree
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file:

```env
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
```

### 4. Start the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
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
```

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

```bash
# Unit and integration tests
npm test

# E2E tests
npm run test:e2e

# Test with coverage
npm test -- --coverage
```

### Building for production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other platforms

See [DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md) for detailed deployment guides.

## API Documentation

See [API.md](docs/api/API.md) for API endpoint documentation.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see LICENSE file for details.
