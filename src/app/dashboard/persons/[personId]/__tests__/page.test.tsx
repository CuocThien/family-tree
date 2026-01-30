import { render, screen } from '@testing-library/react';
import PersonProfilePage from '../page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/services/person/PersonService');

describe('Person Profile Page', () => {
  it('renders person profile', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <PersonProfilePage params={{ personId: 'person-1' }} />
      </QueryClientProvider>
    );

    // Should show loading first
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });
});
