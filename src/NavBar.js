import { Link } from "react-router-dom";
import './navbar.css';
import logo from './assets/logo-r.png';

const NavBar =  ()=> {
  return(
    <header>
      <nav className="navbar">
          <ul className="navbar-nav list-group list-group-horizontal ml-2">
            <li className="nav-item active">
              <Link to="/" className="navbar-brand">
                  <img src={logo} alt="CleanfFix Services Fox Logo" style={{width: '10rem'}}/>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className="nav-link">About</Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className="nav-link">Services</Link>
            </li>
            <li className="nav-item">
              <Link to="/calculators" className="nav-link">Testimonials</Link>
            </li>
            <li className="nav-item">
              <Link to="/calculators" className="nav-link">Calculators</Link>
            </li>
          </ul>
      </nav>
    </header>
  )
}

export default NavBar