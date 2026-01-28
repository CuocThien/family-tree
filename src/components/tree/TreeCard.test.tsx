import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from '@jest/globals';
import { TreeCard } from './TreeCard';
import type { ITree } from '@/types/tree';

const mockTree: ITree = {
  _id: '1',
  ownerId: 'user1',
  name: 'Smith Family Tree',
  collaborators: [],
  settings: {
    isPublic: false,
    allowComments: true,
    defaultPhotoQuality: 'medium',
    language: 'en',
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
};

describe('TreeCard', () => {
  it('renders tree name', () => {
    render(
      <TreeCard
        tree={mockTree}
        memberCount={42}
        lastUpdated={new Date('2024-01-15')}
      />
    );
    expect(screen.getByText('Smith Family Tree')).toBeInTheDocument();
  });

  it('renders member count', () => {
    render(
      <TreeCard
        tree={mockTree}
        memberCount={42}
        lastUpdated={new Date('2024-01-15')}
      />
    );
    expect(screen.getByText('42 members')).toBeInTheDocument();
  });

  it('renders singular member label when count is 1', () => {
    render(
      <TreeCard
        tree={mockTree}
        memberCount={1}
        lastUpdated={new Date('2024-01-15')}
      />
    );
    expect(screen.getByText('1 member')).toBeInTheDocument();
  });

  it('renders relative time for last updated', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    render(
      <TreeCard
        tree={mockTree}
        memberCount={42}
        lastUpdated={oneHourAgo}
      />
    );
    expect(screen.getByText('1h')).toBeInTheDocument();
  });

  it('shows main badge when isMain is true', () => {
    render(
      <TreeCard
        tree={mockTree}
        memberCount={42}
        lastUpdated={new Date('2024-01-15')}
        isMain
      />
    );
    expect(screen.getByText('Main')).toBeInTheDocument();
  });

  it('does not show main badge when isMain is false', () => {
    render(
      <TreeCard
        tree={mockTree}
        memberCount={42}
        lastUpdated={new Date('2024-01-15')}
        isMain={false}
      />
    );
    expect(screen.queryByText('Main')).not.toBeInTheDocument();
  });

  it('renders cover image when provided', () => {
    const coverImage = 'https://example.com/cover.jpg';
    const { container } = render(
      <TreeCard
        tree={mockTree}
        memberCount={42}
        lastUpdated={new Date('2024-01-15')}
        coverImage={coverImage}
      />
    );

    const bgDiv = container.querySelector('[style*="background-image"]');
    expect(bgDiv).toHaveStyle({
      backgroundImage: `url(${coverImage})`,
    });
  });

  it('shows fallback icon when no cover image', () => {
    const { container } = render(
      <TreeCard
        tree={mockTree}
        memberCount={42}
        lastUpdated={new Date('2024-01-15')}
      />
    );

    // Should show the Users icon as fallback
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(
      <TreeCard
        tree={mockTree}
        memberCount={42}
        lastUpdated={new Date('2024-01-15')}
        onClick={handleClick}
      />
    );

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is keyboard accessible', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(
      <TreeCard
        tree={mockTree}
        memberCount={42}
        lastUpdated={new Date('2024-01-15')}
        onClick={handleClick}
      />
    );

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <TreeCard
        tree={mockTree}
        memberCount={42}
        lastUpdated={new Date('2024-01-15')}
        className="custom-class"
      />
    );

    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(
      <TreeCard
        tree={mockTree}
        memberCount={42}
        lastUpdated={new Date('2024-01-15')}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label', 'View tree: Smith Family Tree');
  });
});
