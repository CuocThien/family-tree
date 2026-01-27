import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from '@jest/globals';
import { Toggle } from './Toggle';

describe('Toggle', () => {
  it('renders unchecked by default', () => {
    render(<Toggle />);
    const button = screen.getByRole('switch');
    expect(button).toHaveAttribute('aria-checked', 'false');
    expect(button).toHaveClass('bg-[#e7f1f3]');
  });

  it('renders checked when controlled', () => {
    render(<Toggle checked />);
    const button = screen.getByRole('switch');
    expect(button).toHaveAttribute('aria-checked', 'true');
    expect(button).toHaveClass('bg-[#13c8ec]');
  });

  it('renders with defaultChecked', () => {
    render(<Toggle defaultChecked />);
    const button = screen.getByRole('switch');
    expect(button).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles when clicked in uncontrolled mode', async () => {
    const user = userEvent.setup();
    render(<Toggle />);
    const button = screen.getByRole('switch');

    expect(button).toHaveAttribute('aria-checked', 'false');
    await user.click(button);
    expect(button).toHaveAttribute('aria-checked', 'true');
    await user.click(button);
    expect(button).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange when toggled', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Toggle onChange={handleChange} />);

    const button = screen.getByRole('switch');
    await user.click(button);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Toggle disabled onChange={handleChange} />);

    const button = screen.getByRole('switch');
    expect(button).toHaveAttribute('aria-disabled', 'true');

    await user.click(button);

    expect(handleChange).not.toHaveBeenCalled();
    expect(button).toHaveAttribute('aria-checked', 'false');
  });

  it('renders with label', () => {
    render(<Toggle label="Enable notifications" />);
    expect(screen.getByText('Enable notifications')).toBeInTheDocument();
  });

  it('renders with description', () => {
    render(<Toggle description="Receive email updates" />);
    expect(screen.getByText('Receive email updates')).toBeInTheDocument();
  });

  it('renders with both label and description', () => {
    render(
      <Toggle
        label="Enable notifications"
        description="Receive email updates"
      />
    );
    expect(screen.getByText('Enable notifications')).toBeInTheDocument();
    expect(screen.getByText('Receive email updates')).toBeInTheDocument();
  });

  it('renders with small size', () => {
    render(<Toggle size="sm" />);
    const button = screen.getByRole('switch');
    const container = button.parentElement;
    expect(container?.querySelector('button')).toHaveClass('w-9');
  });

  it('renders with medium size', () => {
    render(<Toggle size="md" />);
    const button = screen.getByRole('switch');
    const container = button.parentElement;
    expect(container?.querySelector('button')).toHaveClass('w-11');
  });

  it('renders with large size', () => {
    render(<Toggle size="lg" />);
    const button = screen.getByRole('switch');
    const container = button.parentElement;
    expect(container?.querySelector('button')).toHaveClass('w-14');
  });

  it('supports keyboard activation with Enter key', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Toggle onChange={handleChange} />);

    const button = screen.getByRole('switch');
    button.focus();
    await user.keyboard('{Enter}');

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('supports keyboard activation with Space key', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Toggle onChange={handleChange} />);

    const button = screen.getByRole('switch');
    button.focus();
    await user.keyboard('{ }');

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('applies custom className', () => {
    render(<Toggle className="custom-class" />);
    const container = screen.getByRole('switch').parentElement;
    expect(container).toHaveClass('custom-class');
  });
});
