import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './NavBar';

describe('Navbar', () => {
  test('renders Navbar links', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const services = screen.getByRole('link', { name: "Services" });
    const calculators = screen.getByRole('link', { name: /calculators/i });

    expect(services).toBeInTheDocument();
    expect(calculators).toBeInTheDocument();
  });

  test('renders company logo', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const logoImage = screen.getByAltText(/CleanfFix Services Logo which includes a an orange fox in blue coverals holding a wrench standing next to the title CleanFix Services/i);

    expect(logoImage).toBeInTheDocument();
    expect(logoImage).toHaveAttribute('src', 'white-rectangle-logo.webp');
  });

});