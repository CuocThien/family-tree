# Task 05: Create Database Connection Utility

**Phase:** 2 - Database Layer
**Priority:** Critical
**Dependencies:** Task 04
**Estimated Complexity:** Low

---

## Objective

Create a robust MongoDB connection utility with connection pooling, reconnection logic, and proper error handling for Next.js serverless environment.

---

## Requirements

### Functional Requirements

1. Connect to MongoDB using connection string
2. Implement connection pooling (singleton pattern)
3. Handle hot module reloading in development
4. Support graceful disconnection
5. Provide connection status monitoring

### Non-Functional Requirements

1. Connection must survive serverless cold starts
2. Must not leak connections in development
3. Support connection timeout configuration
4. Provide meaningful error messages

---

## Technical Specification

### Connection Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| MONGODB_URI | required | Connection string |
| bufferCommands | false | Disable buffering |
| maxPoolSize | 10 | Max connections |
| serverSelectionTimeoutMS | 5000 | Server timeout |
| socketTimeoutMS | 45000 | Socket timeout |

### Global Cache Pattern

```typescript
// Prevent connection leaks in Next.js dev mode
declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}
```

---

## Input Validation

### Pre-conditions

- [ ] Task 04 completed (models exist)
- [ ] mongoose package installed
- [ ] src/lib/db/ directory exists

### Environment Variables

| Variable | Required | Format | Example |
|----------|----------|--------|---------|
| MONGODB_URI | Yes | mongodb+srv:// or mongodb:// | mongodb+srv://user:pass@cluster.mongodb.net/family-tree |

### Validation Steps

```typescript
// Validate connection string format
function validateMongoUri(uri: string): boolean {
  const pattern = /^mongodb(\+srv)?:\/\/.+/;
  return pattern.test(uri);
}
```

---

## Implementation Steps

### Step 1: Write Connection Tests First

Create `tests/unit/lib/db/mongodb.test.ts`:

```typescript
import { connectToDatabase, disconnectFromDatabase, getConnectionStatus } from '@/lib/db/mongodb';

describe('Database Connection', () => {
  afterAll(async () => {
    await disconnectFromDatabase();
  });

  it('should throw if MONGODB_URI not set', async () => {
    const originalUri = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;

    await expect(connectToDatabase()).rejects.toThrow('MONGODB_URI');

    process.env.MONGODB_URI = originalUri;
  });

  it('should connect successfully', async () => {
    const connection = await connectToDatabase();
    expect(connection.connection.readyState).toBe(1);
  });

  it('should reuse existing connection', async () => {
    const conn1 = await connectToDatabase();
    const conn2 = await connectToDatabase();
    expect(conn1).toBe(conn2);
  });

  it('should report connection status', async () => {
    await connectToDatabase();
    const status = getConnectionStatus();
    expect(status.isConnected).toBe(true);
  });

  it('should disconnect gracefully', async () => {
    await connectToDatabase();
    await disconnectFromDatabase();
    const status = getConnectionStatus();
    expect(status.isConnected).toBe(false);
  });
});
```

### Step 2: Implement Connection Utility

Create `src/lib/db/mongodb.ts`:

```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export interface ConnectionOptions {
  maxPoolSize?: number;
  serverSelectionTimeoutMS?: number;
  socketTimeoutMS?: number;
}

export async function connectToDatabase(
  options: ConnectionOptions = {}
): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error(
      'Please define MONGODB_URI environment variable in .env.local'
    );
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: options.maxPoolSize ?? 10,
      serverSelectionTimeoutMS: options.serverSelectionTimeoutMS ?? 5000,
      socketTimeoutMS: options.socketTimeoutMS ?? 45000,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB connected successfully');
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    console.error('MongoDB connection error:', e);
    throw e;
  }

  return cached!.conn;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (cached?.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('MongoDB disconnected');
  }
}

export interface ConnectionStatus {
  isConnected: boolean;
  readyState: number;
  readyStateText: string;
  host?: string;
  name?: string;
}

export function getConnectionStatus(): ConnectionStatus {
  const state = mongoose.connection.readyState;
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    isConnected: state === 1,
    readyState: state,
    readyStateText: states[state] ?? 'unknown',
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
}
```

### Step 3: Create Connection Index Export

Create `src/lib/db/index.ts`:

```typescript
export {
  connectToDatabase,
  disconnectFromDatabase,
  getConnectionStatus,
  type ConnectionOptions,
  type ConnectionStatus,
} from './mongodb';
```

### Step 4: Create Health Check API Route

Create `src/app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getConnectionStatus } from '@/lib/db';

export async function GET() {
  const dbStatus = getConnectionStatus();

  return NextResponse.json({
    status: dbStatus.isConnected ? 'healthy' : 'unhealthy',
    database: {
      connected: dbStatus.isConnected,
      state: dbStatus.readyStateText,
    },
    timestamp: new Date().toISOString(),
  });
}
```

### Step 5: Run Tests

```bash
npm test -- tests/unit/lib/db/
```

---

## Edge Cases

### EC-1: Connection String Missing

**Scenario:** MONGODB_URI not set
**Detection:** connectToDatabase throws
**Resolution:** Clear error message with instructions

### EC-2: Invalid Connection String

**Scenario:** Malformed URI
**Detection:** mongoose.connect rejects
**Resolution:** Validate URI format before connecting

### EC-3: Network Timeout

**Scenario:** MongoDB unreachable
**Detection:** serverSelectionTimeoutMS exceeded
**Resolution:**
- Return meaningful error
- Implement retry logic with backoff

### EC-4: Authentication Failure

**Scenario:** Wrong credentials
**Detection:** MongoServerError: Authentication failed
**Resolution:** Clear error message, check credentials

### EC-5: Hot Reload Connection Leak

**Scenario:** Development mode creates multiple connections
**Detection:** MongoDB logs show many connections
**Resolution:** Global cache pattern (implemented above)

### EC-6: Serverless Cold Start

**Scenario:** New Lambda instance needs connection
**Detection:** cached.conn is null
**Resolution:** Await connection promise

### EC-7: Connection Dropped

**Scenario:** Network interruption
**Detection:** readyState !== 1 after being connected
**Resolution:** Reset cache, reconnect on next call

---

## Acceptance Criteria

- [ ] connectToDatabase connects successfully
- [ ] Connection is reused (singleton)
- [ ] No connection leaks in dev mode
- [ ] disconnectFromDatabase works
- [ ] getConnectionStatus returns correct state
- [ ] Health check API works
- [ ] Clear error messages for all failure modes
- [ ] All tests passing

---

## Performance Considerations

| Metric | Target |
|--------|--------|
| Cold start connection | < 3 seconds |
| Warm connection reuse | < 5 ms |
| Connection pool size | 10 (configurable) |
| Socket timeout | 45 seconds |

---

## Monitoring & Observability

```typescript
// Add connection events for monitoring
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});
```
