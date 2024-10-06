import { render, screen } from '@testing-library/react';
import Calculators from './Calculators';

test('renders learn react link', () => {
  render(
      <Calculators/>
  );

  const title = screen.getByRole('heading', { name: /Calculators/i });
  expect(title).toBeInTheDocument();
});
