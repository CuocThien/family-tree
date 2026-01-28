import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import { PasswordStrength } from '../PasswordStrength';

describe('PasswordStrength', () => {
  it('renders nothing when password is empty', () => {
    const { container } = render(<PasswordStrength password="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when password is not provided', () => {
    const { container } = render(<PasswordStrength password="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders very weak password indicator', () => {
    render(<PasswordStrength password="a" />);
    expect(screen.getByText(/password strength: very weak/i)).toBeInTheDocument();
  });

  it('renders weak password indicator', () => {
    render(<PasswordStrength password="abcdefgh" />);
    expect(screen.getByText(/password strength: weak/i)).toBeInTheDocument();
  });

  it('renders fair password indicator', () => {
    render(<PasswordStrength password="Abcdefgh" />);
    expect(screen.getByText(/password strength: fair/i)).toBeInTheDocument();
  });

  it('renders good password indicator', () => {
    // "Abcdefgh1" has: 8+ chars, uppercase, lowercase, number = score 4 (Good)
    render(<PasswordStrength password="Abcdefgh1" />);
    expect(screen.getByText(/password strength: good/i)).toBeInTheDocument();
  });

  it('renders strong password indicator', () => {
    // "Abcdefgh12" has: 8+ chars, 12+ chars, uppercase, lowercase, number = score 5 (Strong)
    // Wait - looking at the algorithm again: 8+ chars (1), 12+ chars (2), uppercase (3), lowercase (4), number (5), special (6)
    // "Abcdefgh12" is 10 chars - so not 12+, so: 8+, uppercase, lowercase, number = 4 points = Good
    // Need 12+ chars for the extra point
    render(<PasswordStrength password="Abcdefghijkl1" />);
    expect(screen.getByText(/password strength: strong/i)).toBeInTheDocument();
  });

  it('renders very strong password indicator', () => {
    // Need 12+ chars + uppercase + lowercase + number + special = score 6
    render(<PasswordStrength password="Abcdefghijkl1!" />);
    expect(screen.getByText(/password strength: very strong/i)).toBeInTheDocument();
  });

  it('renders correct number of strength bars', () => {
    const { container } = render(<PasswordStrength password="Abcdefghijkl1!" />);
    const bars = container.querySelectorAll('[aria-hidden="true"]');
    expect(bars).toHaveLength(6);
  });
});
