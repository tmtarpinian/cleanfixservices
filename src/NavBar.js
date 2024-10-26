import { Link } from "react-router-dom";
import './navbar.css';
import logo from './assets/white-rectangle-logo.webp'

const NavBar =  ()=> {
  return(
    <header>
      <nav className="navbar">
        <div class="container-fluid px-3">
          <Link to="/" className="navbar-brand">
              <img src={logo} alt="CleanfFix Services Logo which includes a an orange fox in blue coverals holding a wrench standing next to the title CleanFix Services" className="img-fluid"/>
          </Link>
            
          <ul className="navbar-nav list-group list-group-horizontal ml-2">
            {/* <li className="nav-item">
              <Link to="/about" className="nav-link">About</Link>
            </li> */}
            <li className="nav-item">
              <Link to="/about" className="nav-link">Services</Link>
            </li>
            {/* <li className="nav-item">
              <Link to="/calculators" className="nav-link">Testimonials</Link>
            </li> */}
            <li className="nav-item">
              <Link to="/calculators" className="nav-link">Calculators</Link>
            </li>
          </ul>
          </div>
      </nav>
    </header>
  )
}

export default NavBar