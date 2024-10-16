import { Link } from 'react-router-dom'
import './Footer.css'
import circleLogo from './assets/logo-c.png'
const Footer = () => {
  return (
    <footer className="container-fluid footer-container pt-3 pt-md-2">
      <div className="row px-md-4">
        <div className="col-sm mb-4 d-flex justify-content-center">
          <div className="d-flex flex-column w-100">
            <div className="footer-link-with-icon">
              <i className="fa-solid fa-location-pin fa-xs"></i>
              <Link href="https://www.google.com/maps/place/Farmington+Hills,+MI/@42.484156,-83.3771895,13z/data=!3m1!4b1!4m6!3m5!1s0x8824ae2f8c7e3c7f:0x1978ab227e003bbc!8m2!3d42.4989936!4d-83.3677168!16zL20vMHZnYm0?entry=ttu&g_ep=EgoyMDI0MTAwOS4wIKXMDSoASAFQAw%3D%3D">
                <span className="px-2 link-text">
                  Farmington Hills, MI
                </span>
              </Link>
            </div>
            <div className="footer-link-with-icon">
              <i className="fa-solid fa-envelope fa-xs"></i>
              <Link href="mailto:info@cleanfixservices.com">
                <span className="px-2 link-text">
                  info@cleanfixservices.com
                </span>
              </Link>
            </div>
            <div className="footer-link-with-icon">
              <i className="fa-solid fa-phone fa-xs"></i>
              <Link href="tel:313626001">
                <span className="px-2 link-text">
                  313-626-0010
                </span>
              </Link>
            </div>
          </div>
        </div>
        <div className="col-sm mb-4 d-flex justify-content-center align-items-center">
          <div className="d-flex flex-row justify-content-center">
            <div className="px-2">
              <i className="fa-brands fa-facebook fa-xl footer-icon" data-testid="facebook-icon"></i>
            </div>
            <div className="px-2">
              <i className="fa-brands fa-x-twitter fa-xl footer-icon" data-testid="twitter-icon"></i>
            </div>
            <div className="px-2">
              <i className="fa-brands fa-instagram fa-xl footer-icon" data-testid="instagram-icon"></i>
            </div>
          </div>
        </div>
        <div className="col-sm mb-4 d-flex justify-content-center align-items-center">
          <img src={circleLogo} alt="a fox holding a wrench representing the logo of cleanfix services" style={{ height: "35px", width: "35px" }} />
        </div>

      </div>
      <div className='d-flex flex-grow-1 justify-content-center pb-4 copyright'>
        © 2024 CleanFix Services, LLC
      </div>
    </footer>
  )
}

export default Footer

