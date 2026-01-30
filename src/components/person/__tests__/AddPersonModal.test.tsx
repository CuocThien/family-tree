import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddPersonModal } from '../AddPersonModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('AddPersonModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    treeId: 'tree-1',
  };

  it('renders modal with form', () => {
    renderWithQueryClient(<AddPersonModal {...defaultProps} />);

    expect(screen.getByText(/Add New Member/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
  });

  it('shows connection info when connectToPersonId provided', () => {
    renderWithQueryClient(
      <AddPersonModal {...defaultProps} connectToPersonId="person-1" connectToName="John Smith" />
    );

    expect(screen.getByText(/Connecting to/i)).toBeInTheDocument();
    expect(screen.getAllByText(/John Smith/i).length).toBeGreaterThan(0);
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddPersonModal {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /Add to Family Tree/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/First name is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const onCreate = jest.fn().mockResolvedValue({ success: true });

    renderWithQueryClient(<AddPersonModal {...defaultProps} onCreate={onCreate} />);

    await user.type(screen.getByLabelText(/First Name/i), 'Jane');
    await user.type(screen.getByLabelText(/Last Name/i), 'Smith');

    // Female is selected by default (male), let's click to switch to female
    fireEvent.click(screen.getByText('Female'));

    fireEvent.click(screen.getByRole('button', { name: /Add to Family Tree/i }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalled();
    });
  });
});
