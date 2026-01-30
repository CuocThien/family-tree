# Add/Update People in Tree Feature

## Overview
Allows users to add new people to family trees and edit existing person information.

## Features

### Add Person Modal
- Slide-out panel from tree board
- Basic info: first/last name, gender
- Relationship selection when connecting to existing person
- Advanced details: birth/death dates, places, occupation, biography
- Deceased toggle with validation

### Person Profile Page
- Overview tab with biography and life events
- Relationships, Media, Life Events, Sources tabs (planned)
- Edit profile functionality
- Photo management

### Edit Person Modal
- Pre-populated with existing data
- All fields from add modal
- Save changes with validation

## Components

### AddPersonModal
Slide-out panel for adding new persons.
Location: `src/components/person/AddPersonModal.tsx`

### EditPersonModal
Modal for editing existing person data.
Location: `src/components/person/EditPersonModal.tsx`

### PersonProfileHeader
Person info with avatar, dates, locations, stats.
Location: `src/components/person/PersonProfileHeader.tsx`

### PersonProfileTabs
Navigation tabs for profile sections.
Location: `src/components/person/PersonProfileTabs.tsx`

### PersonOverviewTab
Biography and key facts display.
Location: `src/components/person/PersonOverviewTab.tsx`

### PersonProfileSkeleton
Loading skeleton for person profile page.
Location: `src/components/person/PersonProfileSkeleton.tsx`

## Hooks

### useAddPersonToTree
Mutation hook for adding persons and creating relationships.
Location: `src/hooks/useAddPersonToTree.ts`

### useUpdatePerson
Mutation hook for updating person data.
Location: `src/hooks/useUpdatePerson.ts`

## Schemas

### personFormSchema
Zod schema for person validation.
Location: `src/schemas/person.ts`

### addPersonToTreeSchema
Extended schema with relationship data.
Location: `src/schemas/person.ts`

## API Routes

### POST /api/persons
Create a new person.

### PUT /api/persons/[id]
Update person data.

### POST /api/relationships
Create relationship between two persons.

## Pages

### /dashboard/persons/[personId]
Person profile page showing person details, biography, and life events.

## Testing

Unit tests:
- `src/components/person/__tests__/AddPersonModal.test.tsx`
- `src/components/person/__tests__/EditPersonModal.test.tsx`
- `src/hooks/__tests__/useAddPersonToTree.test.tsx`
- `src/schemas/__tests__/person.test.ts`

E2E tests:
- `tests/e2e/persons/add-update-person.spec.ts`
