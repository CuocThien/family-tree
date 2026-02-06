import { render, screen } from '@testing-library/react';
import { EditPersonModal } from '../EditPersonModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IPerson } from '@/types/person';

describe('EditPersonModal', () => {
  const mockPerson: IPerson = {
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

  const mockPerson2: IPerson = {
    _id: 'person-2',
    firstName: 'Jane',
    lastName: 'Doe',
    gender: 'female' as const,
    dateOfBirth: '1960-05-15',
    dateOfDeath: undefined,
    isLiving: true,
    photos: [],
    documents: [],
    customAttributes: new Map(),
    treeId: 'tree-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRelationships = [
    {
      _id: 'rel-person-1-person-2-spouse',
      relatedPersonId: 'person-2',
      relationshipType: 'spouse',
      relatedPersonName: 'Jane Doe',
    },
    {
      _id: 'rel-person-1-person-3-child',
      relatedPersonId: 'person-3',
      relationshipType: 'child',
      relatedPersonName: 'Baby Smith',
    },
  ];

  const mockRelationships2 = [
    {
      _id: 'rel-person-2-person-4-child',
      relatedPersonId: 'person-4',
      relationshipType: 'child',
      relatedPersonName: 'Little Doe',
    },
  ];

  it('renders modal with existing data', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EditPersonModal isOpen person={mockPerson} onClose={() => {}} />
      </QueryClientProvider>
    );

    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
  });

  describe('Modal Refresh with Key Prop', () => {
    it('should mount new instance when key changes (different person)', () => {
      const { rerender } = render(
        <QueryClientProvider client={new QueryClient()}>
          <EditPersonModal
            key="person-1"
            isOpen
            person={mockPerson}
            treeId="tree-1"
            onClose={() => {}}
            existingRelationships={mockRelationships}
          />
        </QueryClientProvider>
      );

      // Verify initial person's data
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1950-01-01')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();

      // Re-render with different key (simulating clicking different person)
      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <EditPersonModal
            key="person-2"
            isOpen
            person={mockPerson2}
            treeId="tree-1"
            onClose={() => {}}
            existingRelationships={mockRelationships2}
          />
        </QueryClientProvider>
      );

      // Verify new person's data is displayed (component was remounted)
      expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1960-05-15')).toBeInTheDocument();
      expect(screen.getByText('Little Doe')).toBeInTheDocument();

      // Verify old person's data is not present
      expect(screen.queryByDisplayValue('John')).not.toBeInTheDocument();
      expect(screen.queryByText('Baby Smith')).not.toBeInTheDocument();
    });

    it('should show correct gender when key changes', () => {
      const { rerender } = render(
        <QueryClientProvider client={new QueryClient()}>
          <EditPersonModal
            key="person-1"
            isOpen
            person={mockPerson}
            treeId="tree-1"
            onClose={() => {}}
          />
        </QueryClientProvider>
      );

      // Initial person is male
      const maleButton = screen.getByText('Male').closest('button');
      expect(maleButton).toHaveClass('border-primary');

      // Re-render with different key (female person)
      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <EditPersonModal
            key="person-2"
            isOpen
            person={mockPerson2}
            treeId="tree-1"
            onClose={() => {}}
          />
        </QueryClientProvider>
      );

      // Verify female button is selected
      const femaleButton = screen.getByText('Female').closest('button');
      expect(femaleButton).toHaveClass('border-primary');
    });

    it('should show correct relationships when key changes', () => {
      const { rerender } = render(
        <QueryClientProvider client={new QueryClient()}>
          <EditPersonModal
            key="person-1"
            isOpen
            person={mockPerson}
            treeId="tree-1"
            onClose={() => {}}
            existingRelationships={mockRelationships}
          />
        </QueryClientProvider>
      );

      // Verify initial relationships
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Baby Smith')).toBeInTheDocument();

      // Re-render with different key (different person, different relationships)
      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <EditPersonModal
            key="person-2"
            isOpen
            person={mockPerson2}
            treeId="tree-1"
            onClose={() => {}}
            existingRelationships={mockRelationships2}
          />
        </QueryClientProvider>
      );

      // Verify new relationships are displayed
      expect(screen.getByText('Little Doe')).toBeInTheDocument();

      // Verify old relationships are not present
      expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Baby Smith')).not.toBeInTheDocument();
    });

    it('should correctly expand/collapse relationships section based on new person', () => {
      const { rerender } = render(
        <QueryClientProvider client={new QueryClient()}>
          <EditPersonModal
            key="person-1"
            isOpen
            person={mockPerson}
            treeId="tree-1"
            onClose={() => {}}
            existingRelationships={mockRelationships}
          />
        </QueryClientProvider>
      );

      // With relationships, section should be expanded (no Manage button)
      expect(screen.queryByText('Manage')).not.toBeInTheDocument();

      // Re-render with different key (person with no relationships)
      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <EditPersonModal
            key="person-2"
            isOpen
            person={mockPerson2}
            treeId="tree-1"
            onClose={() => {}}
            existingRelationships={[]}
          />
        </QueryClientProvider>
      );

      // Without relationships, section should be collapsed (Manage button present)
      expect(screen.getByText('Manage')).toBeInTheDocument();
    });
  });

  describe('Relationship Display', () => {
    it('preserves relatedPersonName when passing relationships to useManageRelationships', () => {
      const { container } = render(
        <QueryClientProvider client={new QueryClient()}>
          <EditPersonModal
            isOpen
            person={mockPerson}
            treeId="tree-1"
            onClose={() => {}}
            existingRelationships={mockRelationships}
          />
        </QueryClientProvider>
      );

      // Verify relationships section is expanded when relationships exist
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Baby Smith')).toBeInTheDocument();
    });

    it('shows relationships section by default when relationships exist', () => {
      render(
        <QueryClientProvider client={new QueryClient()}>
          <EditPersonModal
            isOpen
            person={mockPerson}
            treeId="tree-1"
            onClose={() => {}}
            existingRelationships={mockRelationships}
          />
        </QueryClientProvider>
      );

      // The relationship names should be visible
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Spouse')).toBeInTheDocument();
    });

    it('keeps relationships section collapsed when no relationships exist', () => {
      render(
        <QueryClientProvider client={new QueryClient()}>
          <EditPersonModal
            isOpen
            person={mockPerson}
            treeId="tree-1"
            onClose={() => {}}
            existingRelationships={[]}
          />
        </QueryClientProvider>
      );

      // The "Manage" button should be present when section is collapsed
      const manageButton = screen.getByText('Manage');
      expect(manageButton).toBeInTheDocument();
    });

    it('displays correct relationship type for each relationship', () => {
      render(
        <QueryClientProvider client={new QueryClient()}>
          <EditPersonModal
            isOpen
            person={mockPerson}
            treeId="tree-1"
            onClose={() => {}}
            existingRelationships={mockRelationships}
          />
        </QueryClientProvider>
      );

      expect(screen.getByText('Spouse')).toBeInTheDocument();
      expect(screen.getByText('Child')).toBeInTheDocument();
    });

    it('does not show "Unknown" when relatedPersonName is provided', () => {
      render(
        <QueryClientProvider client={new QueryClient()}>
          <EditPersonModal
            isOpen
            person={mockPerson}
            treeId="tree-1"
            onClose={() => {}}
            existingRelationships={mockRelationships}
          />
        </QueryClientProvider>
      );

      // Should not show "Unknown" since we have actual names
      const unknownElements = screen.queryAllByText('Unknown');
      expect(unknownElements).toHaveLength(0);
    });
  });
});
