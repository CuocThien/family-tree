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
  }),
}));

// Mock global fetch
global.fetch = jest.fn();

// Import after mocks
import RegisterPage from '../page';

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);
  });

  it('renders registration form', () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows name validation error', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText(/full name/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.clear(nameInput);
    await user.type(nameInput, 'a');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('shows email validation error', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.clear(emailInput);
    await user.type(emailInput, 'invalid');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('shows password validation errors', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'weak');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('shows password mismatch error', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'Password456');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('shows terms acceptance error', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'Password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/must accept the terms/i)).toBeInTheDocument();
    });
  });

  it('has password visibility toggles', () => {
    render(<RegisterPage />);
    const toggleButtons = screen.getAllByLabelText(/show password/i);
    expect(toggleButtons).toHaveLength(2);
  });

  it('renders terms and privacy links', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('link', { name: /terms of service/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /privacy policy/i })).toBeInTheDocument();
  });

  it('renders Google and Facebook OAuth buttons', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('button', { name: /sign up with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up with facebook/i })).toBeInTheDocument();
  });

  it('renders sign in link', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('has SSL badge', () => {
    render(<RegisterPage />);
    expect(screen.getByText(/secured with ssl/i)).toBeInTheDocument();
  });
});
