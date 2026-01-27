import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from '@jest/globals';
import { PersonCard } from './PersonCard';
import type { IPerson } from '@/types/person';

const mockPerson: IPerson = {
  _id: '1',
  treeId: 'tree1',
  firstName: 'John',
  lastName: 'Smith',
  middleName: 'William',
  dateOfBirth: new Date('1980-05-15'),
  dateOfDeath: undefined,
  gender: 'male',
  biography: 'A beloved family member',
  photos: ['https://example.com/photo.jpg'],
  documents: [],
  customAttributes: new Map(),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
};

describe('PersonCard', () => {
  it('renders person full name', () => {
    render(<PersonCard person={mockPerson} />);
    expect(screen.getByText('John William Smith')).toBeInTheDocument();
  });

  it('renders person name without middle name when missing', () => {
    const personWithoutMiddleName = { ...mockPerson, middleName: undefined };
    render(<PersonCard person={personWithoutMiddleName} />);
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('renders birth year when dateOfBirth is present', () => {
    render(<PersonCard person={mockPerson} />);
    expect(screen.getByText(/1980/)).toBeInTheDocument();
  });

  it('renders death year when dateOfDeath is present', () => {
    const deceasedPerson = {
      ...mockPerson,
      dateOfDeath: new Date('2020-12-31'),
    };
    render(<PersonCard person={deceasedPerson} />);
    expect(screen.getByText(/2020/)).toBeInTheDocument();
  });

  it('shows Deceased badge when person has died', () => {
    const deceasedPerson = {
      ...mockPerson,
      dateOfDeath: new Date('2020-12-31'),
    };
    render(<PersonCard person={deceasedPerson} />);
    expect(screen.getByText('Deceased')).toBeInTheDocument();
  });

  it('renders gender label in detailed variant', () => {
    render(<PersonCard person={mockPerson} variant="detailed" />);
    expect(screen.getByText('Male')).toBeInTheDocument();
  });

  it('renders biography in detailed variant', () => {
    render(<PersonCard person={mockPerson} variant="detailed" />);
    expect(screen.getByText('A beloved family member')).toBeInTheDocument();
  });

  it('shows photo count in detailed variant', () => {
    render(<PersonCard person={mockPerson} variant="detailed" />);
    expect(screen.getByText('1 photo')).toBeInTheDocument();
  });

  it('shows plural photo count when multiple', () => {
    const personWithPhotos = {
      ...mockPerson,
      photos: ['photo1.jpg', 'photo2.jpg'],
    };
    render(<PersonCard person={personWithPhotos} variant="detailed" />);
    expect(screen.getByText('2 photos')).toBeInTheDocument();
  });

  it('renders compact variant', () => {
    const { container } = render(
      <PersonCard person={mockPerson} variant="compact" />
    );
    expect(screen.getByText('John William Smith')).toBeInTheDocument();
    expect(screen.getByText(/1980/)).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<PersonCard person={mockPerson} onClick={handleClick} />);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders actions when showActions is true', () => {
    render(
      <PersonCard
        person={mockPerson}
        showActions
        actions={<button data-testid="action-btn">Action</button>}
      />
    );
    expect(screen.getByTestId('action-btn')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PersonCard person={mockPerson} className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<PersonCard person={mockPerson} />);
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label', 'View John William Smith');
  });

  it('handles person without photo', () => {
    const personWithoutPhoto = { ...mockPerson, photos: [] };
    const { container } = render(
      <PersonCard person={personWithoutPhoto} />
    );
    // Should render avatar with initials
    const avatar = container.querySelector('img');
    expect(avatar).not.toBeInTheDocument();
  });
});
