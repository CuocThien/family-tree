import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders with default size', () => {
    render(<Spinner />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('h-6', 'w-6');
  });

  it('renders with extra small size', () => {
    render(<Spinner size="xs" />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('h-3', 'w-3');
  });

  it('renders with small size', () => {
    render(<Spinner size="sm" />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('h-4', 'w-4');
  });

  it('renders with medium size', () => {
    render(<Spinner size="md" />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('h-6', 'w-6');
  });

  it('renders with large size', () => {
    render(<Spinner size="lg" />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('h-8', 'w-8');
  });

  it('renders with extra large size', () => {
    render(<Spinner size="xl" />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('h-12', 'w-12');
  });

  it('renders with primary color', () => {
    render(<Spinner color="primary" />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('text-[#13c8ec]');
  });

  it('renders with white color', () => {
    render(<Spinner color="white" />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('text-white');
  });

  it('renders with current color', () => {
    render(<Spinner color="current" />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('text-current');
  });

  it('applies custom className', () => {
    render(<Spinner className="custom-class" />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('custom-class');
  });

  it('has correct accessibility attributes', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('has animate-spin class for animation', () => {
    render(<Spinner />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('animate-spin');
  });

  it('is an SVG element', () => {
    render(<Spinner />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner.tagName.toLowerCase()).toBe('svg');
  });
});
