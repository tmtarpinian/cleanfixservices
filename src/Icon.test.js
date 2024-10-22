import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Icon from './Icon'
import { ICONS } from './constants';

describe('Icon', () => {
  test('renders icon with hyperlink', () => {
    render(
      <MemoryRouter>
        <Icon 
          opts={{
            padding: "px-2",
            url: ICONS.TWITTER,
            class: "fa-brands fa-x-twitter fa-xl footer-icon",
            testId: "twitter-icon",
        }}
        />
      </MemoryRouter>
    );

    // const locationLink = screen.getByRole('link');
    const locationLink = screen.getByTestId('twitter-icon')
    expect(locationLink).toBeInTheDocument();
    })
  });
