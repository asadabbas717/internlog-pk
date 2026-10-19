import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';

describe('foundation shell', () => {
  it('exposes landmarks, a skip link, and an honest development boundary', async () => {
    render(<App />);
    expect(screen.getByRole('main').id).toBe('main');
    expect(
      screen
        .getByRole('link', { name: 'Skip to content' })
        .getAttribute('href'),
    ).toBe('#main');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(
      /Your internship,\s*clearly recorded\./,
    );
    expect(
      screen.getByText(/You cannot enter student records yet/),
    ).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect((await screen.findByRole('status')).textContent).toContain(
      'Development mode',
    );
  });
  it('explains local data loss and institutional independence', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: 'Local does not mean permanent.' }),
    ).toBeTruthy();
    expect(
      screen.getByText(/Not an official HEC or university application/),
    ).toBeTruthy();
  });
});
