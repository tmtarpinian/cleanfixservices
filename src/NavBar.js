import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PHONE } from './constants'
import logo from './assets/logo-c.png'
import './navbar.css'

const NAV_LINKS = [
  { to: '/#services', label: 'Services' },
  { to: '/calculators', label: 'Calculators' },
  { to: '/contact', label: 'Contact' },
]

const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/>
  </svg>
)

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-header">
      <div className="bar">
        <Link to="/" className="brand" onClick={closeMenu}>
          <img src={logo} alt="CleanFix Services fox mascot logo" />
          <span className="word">CleanFix <span>Services</span></span>
        </Link>
        <nav className="desktop-nav" aria-label="Main">
          {NAV_LINKS.map(link => <Link key={link.label} to={link.to}>{link.label}</Link>)}
          <Link to="/contact" className="btn btn-primary nav-book-btn">Book now</Link>
        </nav>
        <div className="header-cta">
          <a className="btn-call-mini" href={PHONE.TEL} aria-label="Call CleanFix Services">
            <PhoneIcon />
            Call
          </a>
          <button
            className="menu-btn"
            aria-expanded={menuOpen}
            aria-controls="mobileNav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen(open => !open)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18"/> : <path d="M4 7h16M4 12h16M4 17h16"/>}
            </svg>
          </button>
        </div>
      </div>
      <nav className={`mobile-nav${menuOpen ? ' open' : ''}`} id="mobileNav" aria-label="Mobile">
        <ul>
          {NAV_LINKS.map(link => (
            <li key={link.label}>
              <Link to={link.to} onClick={closeMenu}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

export default NavBar
