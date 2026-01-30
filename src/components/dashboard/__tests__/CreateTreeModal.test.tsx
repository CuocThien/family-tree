import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateTreeModal } from '../CreateTreeModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

describe('CreateTreeModal', () => {
  it('renders modal with form', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <CreateTreeModal isOpen onClose={() => {}} />
      </Wrapper>
    );

    expect(screen.getByText(/Create New Family Tree/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tree Name/i)).toBeInTheDocument();
  });

  it('should validate tree name', async () => {
    const user = userEvent.setup();
    const onCreate = jest.fn().mockResolvedValue({ success: true });
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <CreateTreeModal isOpen onClose={() => {}} onCreate={onCreate} />
      </Wrapper>
    );

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /Create Tree/i });
    await user.click(submitButton);

    // Wait for validation to run and check that onCreate was not called
    await waitFor(() => {
      expect(onCreate).not.toHaveBeenCalled();
    });
  });

  it('should call onCreate with form data', async () => {
    const onCreate = jest.fn().mockResolvedValue({ success: true });
    const onClose = jest.fn();
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <CreateTreeModal isOpen onClose={onClose} onCreate={onCreate} />
      </Wrapper>
    );

    // Fill in the form using the actual input event
    const nameInput = screen.getByLabelText(/Tree Name/i);
    const submitButton = screen.getByRole('button', { name: /Create Tree/i });

    // Use a more complete approach to fill the input
    fireEvent.input(nameInput, { target: { value: 'Smith Family Tree' } });

    // Wait for value to be set
    await waitFor(() => {
      expect(nameInput).toHaveValue('Smith Family Tree');
    });

    // Click submit button
    fireEvent.click(submitButton);

    // Verify onCreate was called
    await waitFor(() => {
      expect(onCreate).toHaveBeenCalled();
    });
  });

  it('should close modal on backdrop click', () => {
    const onClose = jest.fn();
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <CreateTreeModal isOpen onClose={onClose} />
      </Wrapper>
    );

    const backdrop = screen.getByText(/Create New Family Tree/i).closest('.fixed.inset-0');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(onClose).toHaveBeenCalled();
  });
});
