import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClientMultiSelect } from './client-filter';
import React from 'react';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Users: () => <div data-testid="users-icon" />,
  Check: () => <div data-testid="check-icon" />,
  ChevronDown: () => <div data-testid="chevron-icon" />,
}));

// Mock user context if needed, but ClientMultiSelect is pure
describe('ClientMultiSelect', () => {
  const mockClients = [
    { client_id: '1', client_name: 'Client A' },
    { client_id: '2', client_name: 'Client B' },
  ];
  const mockOnChange = vi.fn();

  it('renders correctly with default state', () => {
    render(
      <ClientMultiSelect
        clients={mockClients}
        selectedKeys={[]}
        onChange={mockOnChange}
      />
    );
    expect(screen.getByText('All Accounts')).toBeDefined();
  });

  it('opens dropdown on click and has z-50 class', () => {
    render(
      <ClientMultiSelect
        clients={mockClients}
        selectedKeys={[]}
        onChange={mockOnChange}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Filter to find the dropdown container using its classes
    const clientsList = screen.getByText('Client A').closest('div')?.parentElement;
    expect(clientsList).toBeDefined();
    
    // Check for the z-50 class which ensures it's above table headers
    expect(clientsList?.className).toContain('z-50');
  });

  it('shows selected count when items are checked', () => {
    render(
      <ClientMultiSelect
        clients={mockClients}
        selectedKeys={['Client A']}
        onChange={mockOnChange}
      />
    );
    expect(screen.getByText('1 Selected')).toBeDefined();
  });
});
