import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { act } from 'react'
import About from './About';

test('renders learn react link', async() => {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <About/>
    </MemoryRouter>
    );
  })

  const title = screen.getByRole('heading', { name: /About/i });
  expect(title).toBeInTheDocument();
});
