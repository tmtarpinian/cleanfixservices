import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { act } from 'react'; // Ensure act is imported from react
import Service from './Service';

const service = {
  name: "light plumbing",
  summary: "From fixing slow filling toilets and leaking sinks, to swapping out garbage disposals, we can fix your small plubming issues.",
  source: "plumbing",
  alt: "Washing hands in a working bathroom sink"
}

test('renders service component', () => {

   act(() => {
    render(
      <BrowserRouter>
        <Service service={service}/>
      </BrowserRouter>
    );
  });

  const paragraph = screen.getByText(service.summary);
  expect(paragraph).toBeInTheDocument();
 
  const img = screen.getByRole('img', { name: service.alt })
  expect(img).toBeInTheDocument();

  const heading = screen.getByRole('heading', { name: new RegExp(`${service.name}`) });
  expect(heading).toBeInTheDocument();

  const bookNowLink = screen.getByRole('link', { name: /Book Now/i });
  expect(bookNowLink).toBeInTheDocument();

});
