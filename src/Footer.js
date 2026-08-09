import { ICONS, PHONE } from './constants'
import logo from './assets/logo-c.png'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <img src={logo} alt="CleanFix Services fox mascot" />
            <span className="word">CleanFix Services</span>
          </div>
          <div className="foot-contact">
            <a href="https://www.google.com/maps/place/Farmington+Hills,+MI">Farmington Hills, MI</a>
            <a href="mailto:info@cleanfixservices.com">info@cleanfixservices.com</a>
            <a href={PHONE.TEL}>{PHONE.DISPLAY}</a>
          </div>
          <div className="foot-social" aria-label="Social media">
            <a href={ICONS.FACEBOOK}>Facebook</a>
            <a href={ICONS.INSTAGRAM}>Instagram</a>
            <a href={ICONS.TWITTER}>X</a>
            <a href={ICONS.NEXTDOOR}>Nextdoor</a>
          </div>
        </div>
        <div className="copyright">© {new Date().getFullYear()} CleanFix Services, LLC</div>
      </div>
    </footer>
  )
}

export default Footer
