import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

describe('Footer', () => {
  test('renders footer links', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    const locationLink = screen.getByRole('link', { name: /farmington hills, mi/i });
    const emailLink = screen.getByRole('link', { name: /info@cleanfixservices.com/i });
    const phoneLink = screen.getByRole('link', { name: /248-385-2881/i });

    expect(locationLink).toBeInTheDocument();
    expect(emailLink).toBeInTheDocument();
    expect(phoneLink).toBeInTheDocument();
  });

  test('renders social media icons', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    const facebookIcon = screen.getByTestId('facebook-icon');
    const twitterIcon = screen.getByTestId('twitter-icon');
    const instagramIcon = screen.getByTestId('instagram-icon');
    const nextdoorIcon = screen.getByTestId('instagram-icon');

    expect(facebookIcon).toBeInTheDocument();
    expect(twitterIcon).toBeInTheDocument();
    expect(instagramIcon).toBeInTheDocument();
    expect(nextdoorIcon).toBeInTheDocument();
  });

  test('renders company logo', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    const logoImage = screen.getByAltText(/a fox holding a wrench representing the logo of cleanfix services/i);

    expect(logoImage).toBeInTheDocument();
    expect(logoImage).toHaveAttribute('src', 'black-circle-logo.webp');
  });

  test('renders copyright text', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    const copyrightText = screen.getByText(/© 2024 CleanFix Services, LLC/i);

    expect(copyrightText).toBeInTheDocument();
  });
});