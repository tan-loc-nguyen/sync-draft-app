import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import Editor from './Editor';

describe('Editor', () => {
  it('renders the content it is given', async () => {
    render(<Editor content="<p>Chapter one</p>" />);

    await waitFor(() => expect(screen.getByText('Chapter one')).toBeInTheDocument());
  });

  it('shows formatting controls when editable', async () => {
    render(<Editor content="<p>text</p>" onChange={vi.fn()} />);

    await waitFor(() => expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument());
  });

  // The merge comparison panes render two read-only copies side by side; a
  // toolbar there would be misleading.
  it('hides formatting controls when read only', async () => {
    render(<Editor content="<p>text</p>" editable={false} />);

    await waitFor(() => expect(screen.getByText('text')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /bold/i })).not.toBeInTheDocument();
  });
});
