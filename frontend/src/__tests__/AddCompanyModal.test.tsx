import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AddCompanyModal from '@/components/AddCompanyModal';
describe('company suggestions', () => {
  it('labels every field and identifies missing fields inline', async () => {
    const user = userEvent.setup();
    render(<AddCompanyModal open onOpenChange={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Review suggestion' }));
    expect(screen.getByLabelText('Company name *')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('City or location *')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Company name is required.')).toBeInTheDocument();
  });
  it('reviews human-readable details before opening the existing GitHub destination', async () => {
    const user = userEvent.setup();
    render(<AddCompanyModal open onOpenChange={vi.fn()} />);
    await user.type(screen.getByLabelText('Company name *'), 'Example Tech');
    await user.type(screen.getByLabelText('Company registration number (ח.פ) *'), '513674309');
    await user.selectOptions(screen.getByLabelText('Industry *'), '1');
    await user.selectOptions(screen.getByLabelText('Company size *'), 'm');
    await user.type(screen.getByLabelText('Careers URL *'), 'https://example.com/careers');
    await user.type(screen.getByLabelText('City or location *'), 'Tel Aviv');
    await user.click(screen.getByRole('button', { name: 'Review suggestion' }));
    expect(screen.getByRole('heading', { name: 'Example Tech' })).toBeInTheDocument();
    expect(screen.queryByText('Generated JSON')).not.toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Continue on GitHub' });
    const url = new URL(link.getAttribute('href')!);
    expect(url.pathname).toBe('/natifridman/techjobs/issues/new');
    expect(url.searchParams.get('body')).toContain('513674309');
    expect(url.searchParams.get('body')).toContain('"categoryId": 1');
    await user.click(screen.getByRole('button', { name: 'Edit details' }));
    expect(screen.getByLabelText('Company name *')).toHaveValue('Example Tech');
  });
});
