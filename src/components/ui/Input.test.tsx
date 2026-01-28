import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from '@jest/globals';
import { Input } from './Input';

describe('Input', () => {
  it('renders input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Username" />);
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('associates label with input via htmlFor', () => {
    render(<Input label="Email" />);
    const label = screen.getByText('Email');
    const input = screen.getByRole('textbox');
    expect(label).toHaveAttribute('for', input.id);
  });

  it('shows error message', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows hint text when no error', () => {
    render(<Input hint="Enter your email address" />);
    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
  });

  it('does not show hint when error is present', () => {
    render(
      <Input
        error="This field is required"
        hint="Enter your email address"
      />
    );
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.queryByText('Enter your email address')).not.toBeInTheDocument();
  });

  it('renders with left icon', () => {
    render(
      <Input
        leftIcon={<span data-testid="left-icon">@</span>}
        label="Username"
      />
    );
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    render(
      <Input
        rightIcon={<span data-testid="right-icon">✓</span>}
        label="Password"
      />
    );
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('textbox')).toHaveClass('disabled:opacity-50');
  });

  it('handles user input', async () => {
    const user = userEvent.setup();
    render(<Input label="Username" />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'testuser');

    expect(input).toHaveValue('testuser');
  });

  it('passes through other input props', () => {
    render(
      <Input
        type="email"
        placeholder="test@example.com"
        name="email"
      />
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'test@example.com');
    expect(input).toHaveAttribute('name', 'email');
  });

  it('uses custom id when provided', () => {
    render(<Input id="custom-id" label="Custom Label" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'custom-id');
    // React's htmlFor attribute becomes 'for' in HTML
    expect(screen.getByText('Custom Label')).toHaveAttribute('for', 'custom-id');
  });

  it('generates id from label when not provided', () => {
    render(<Input label="Test Label" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'test-label');
  });

  it('associates error message with input via aria-describedby', () => {
    render(<Input label="Test" error="Error message" />);
    const input = screen.getByRole('textbox');
    const error = screen.getByText('Error message');
    // The inputId is 'test' and errorId is 'test-error'
    expect(input).toHaveAttribute('aria-describedby', 'test-error');
    // The error message paragraph has the id attribute
    const errorContainer = error.closest('p');
    expect(errorContainer).toHaveAttribute('id', 'test-error');
  });

  it('associates hint with input via aria-describedby when no error', () => {
    render(<Input label="Test" hint="Hint text" />);
    const input = screen.getByRole('textbox');
    const hint = screen.getByText('Hint text');
    expect(input).toHaveAttribute('aria-describedby', hint.id);
  });
});
