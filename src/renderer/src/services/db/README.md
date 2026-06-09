# Unified Data Access Layer

This module provides a unified interface for accessing message data:

- **DexieMessageDataSource**: Local IndexedDB storage for regular chat messages

## Architecture

```
dbService (Facade)
    └── Routes to DexieMessageDataSource
```

## Usage

```typescript
import { dbService } from '@renderer/services/db'

// Fetch messages
const { messages, blocks } = await dbService.fetchMessages(topicId)

// Append a single message
await dbService.appendMessage(topicId, message, blocks)

// Check if topic exists
const exists = await dbService.topicExists(topicId)
```

## Key Features

1. **Consistent API**: Same methods are used throughout the renderer
2. **Type Safety**: Full TypeScript support with proper interfaces
3. **Error Handling**: Comprehensive error logging and propagation
4. **Extensibility**: Easy to add new data sources (e.g., cloud storage)

## Implementation Status

### DexieMessageDataSource ✅
- Full CRUD operations for messages and blocks
- Transaction support
- File cleanup on deletion
- Redux state updates

## Usage Pattern

```typescript
// In thunks
const { messages, blocks } = await dbService.fetchMessages(topicId)
```
