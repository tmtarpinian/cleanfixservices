import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import Home from './pages/home/Home';
import About from './pages/About';
import Calculators from './pages/Calculators';
import Footer from './Footer'

describe('App', () => {
  
  test('renders App with NavBar', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
  
    const navbar = screen.getByRole('navigation');
    expect(navbar).toBeInTheDocument();
  });

  test('renders Home component for / route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Home />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  
    const homeElement = screen.getByText(/Check Those Items/i); // Adjust the text to match your Home component
    expect(homeElement).toBeInTheDocument();
  });

  test('renders About component for /about route', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <Routes>
          <Route path="/" element={<App />}>
            <Route path="about" element={<About />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  
    const aboutElement = screen.getByText(/About Page/i); // Adjust the text to match your About component
    expect(aboutElement).toBeInTheDocument();
  });
  
  test('renders Calculators component for /calculators route', () => {
    render(
      <MemoryRouter initialEntries={['/calculators']}>
        <Routes>
          <Route path="/" element={<App />}>
            <Route path="calculators" element={<Calculators />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  
    const calculatorsElement = screen.getByText(/Calculators Page/i); // Adjust the text to match your Calculators component
    expect(calculatorsElement).toBeInTheDocument();
  });

  test('renders App with Footer', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    const navbar = screen.getByRole('contentinfo');
    expect(navbar).toBeInTheDocument();
  });
});
