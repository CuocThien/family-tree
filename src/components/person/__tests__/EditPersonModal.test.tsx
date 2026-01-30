import { render, screen } from '@testing-library/react';
import { EditPersonModal } from '../EditPersonModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('EditPersonModal', () => {
  const mockPerson = {
    _id: 'person-1',
    firstName: 'John',
    lastName: 'Smith',
    gender: 'male' as const,
    dateOfBirth: '1950-01-01',
    dateOfDeath: undefined,
    isLiving: true,
    photos: [],
    documents: [],
    customAttributes: new Map(),
    treeId: 'tree-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('renders modal with existing data', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EditPersonModal isOpen person={mockPerson} onClose={() => {}} />
      </QueryClientProvider>
    );

    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
  });
});
