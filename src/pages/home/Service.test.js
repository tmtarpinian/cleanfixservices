import { render, screen } from '@testing-library/react';
import Service from './Service';

test('renders learn react link', () => {
  render(
    <Service />
  );

  const title = screen.getByRole('heading', { name: /Home/i });
  expect(title).toBeInTheDocument();
});
