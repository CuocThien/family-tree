# API Documentation

Base URL: `https://yourdomain.com/api`

## Authentication

Most endpoints require authentication via JWT token in Authorization header:

```
Authorization: Bearer <token>
```

## Trees API

### GET /api/trees

Get all trees for authenticated user.

**Response:**
```json
{
  "id": "123",
  "name": "My Family Tree",
  "description": "...",
  "ownerId": "user123",
  "createdAt": "2024-01-01T00:00:00Z",
  "personCount": 25
}
```

### POST /api/trees

Create a new tree.

**Request:**
```json
{
  "name": "My Family Tree",
  "description": "A family tree"
}
```

**Response:** 201 Created

### GET /api/trees/[id]

Get tree by ID.

### PUT /api/trees/[id]

Update tree.

### DELETE /api/trees/[id]

Delete tree (cascades to persons and relationships).

### GET /api/trees/[id]/export

Export tree data as JSON.

## Persons API

### POST /api/persons

Create a person.

**Request:**
```json
{
  "treeId": "tree123",
  "name": "John Doe",
  "birthDate": "1990-01-01",
  "deathDate": null,
  "gender": "male",
  "bio": "Born in New York"
}
```

### GET /api/persons/[id]

Get person by ID.

### PUT /api/persons/[id]

Update person.

### DELETE /api/persons/[id]

Delete person.

### GET /api/trees/[id]/persons

Get all persons in a tree.

## Relationships API

### POST /api/relationships

Create relationship.

**Request:**
```json
{
  "treeId": "tree123",
  "fromPersonId": "person1",
  "toPersonId": "person2",
  "type": "parent-child"
}
```

### DELETE /api/relationships/[id]

Delete relationship.

## Media API

### POST /api/media/upload

Upload file.

**Request:** multipart/form-data

### DELETE /api/media/[id]

Delete media.

## Dashboard API

### GET /api/dashboard

Get dashboard data (tree count, person count, recent activity).

## User API

### PUT /api/user/profile

Update user profile.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "bio": "..."
}
```

### PUT /api/user/password

Change password.

**Request:**
```json
{
  "currentPassword": "oldpass",
  "newPassword": "newpass"
}
```

## Error Responses

All endpoints may return:

- 400 Bad Request - Invalid input
- 401 Unauthorized - Not authenticated
- 403 Forbidden - No permission
- 404 Not Found - Resource not found
- 500 Internal Server Error - Server error
