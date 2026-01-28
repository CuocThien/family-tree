import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn((key) => (key === 'callbackUrl' ? '/dashboard' : null)),
  }),
}));

// Import after mocks
import LoginPage from '../page';

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders Google and Facebook OAuth buttons', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with facebook/i })).toBeInTheDocument();
  });

  it('shows email validation error', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.clear(emailInput);
    await user.type(emailInput, 'invalid');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('shows password required error', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const toggleButton = screen.getByLabelText(/show password/i);

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(toggleButton).toHaveAttribute('aria-label', 'Hide password');
  });

  it('shows remember me checkbox', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
  });

  it('renders forgot password link', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
  });

  it('renders sign up link', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });

  it('has SSL badge', () => {
    render(<LoginPage />);
    expect(screen.getByText(/secured with ssl/i)).toBeInTheDocument();
  });
});
