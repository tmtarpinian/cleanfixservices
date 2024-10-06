import { render, screen } from '@testing-library/react';
import About from './About';

test('renders learn react link', () => {
  render(
      <About/>
  );

  const title = screen.getByRole('heading', { name: /About/i });
  expect(title).toBeInTheDocument();
});
