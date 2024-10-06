import { render, screen } from '@testing-library/react';
import Home from './Home';

test('renders learn react link', () => {
  render(
    <Home />
  );

  const title = screen.getByRole('heading', { name: /Home/i });
  expect(title).toBeInTheDocument();
});
