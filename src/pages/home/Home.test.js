import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { act } from 'react'; // Ensure act is imported from react
import Home from './Home';

test('renders home component', async () => {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Home />
      </MemoryRouter>
    );
  });

  const titleOne = screen.getByText(/Check those items/i);
  const titleTwo = screen.getByText(/off your Todo List/i);

  expect(titleOne).toBeInTheDocument();
  expect(titleTwo).toBeInTheDocument();

  // Check if the elements have the class 'homepage-title'
  expect(titleOne).toHaveClass('homepage-title');
  expect(titleTwo).toHaveClass('homepage-title');
});