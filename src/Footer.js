import { Link } from 'react-router-dom'
import { ICONS } from './constants'
import Icon from './Icon'
import Nextdoor from './utils/icons/Nextdoor'
import './Footer.css'
import circleLogo from './assets/black-circle-logo.webp'
const Footer = () => {
  return (
    <footer className="container-fluid footer-container pt-3 pt-md-2 h-10">
      <div className="row px-md-4">
        <div className="col-sm d-flex justify-content-center align-items-center">
          <div className="d-flex flex-column">
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
              <Link href="tel:2483852881">
                <span className="px-2 link-text">
                  248-385-2881
                </span>
              </Link>
            </div>
          </div>
        </div>
        <div className="col-sm my-auto d-flex justify-content-center">
          <div className="d-flex flex-row align-items-center">
            <Icon 
              opts = {{
                padding: "px-2",
                url: ICONS.FACEBOOK,
                class: "fa-brands fa-facebook fa-xl footer-icon",
                testId: "facebook-icon",
              }}
            />
            <Icon 
              opts = {{
                padding: "px-2",
                url: ICONS.TWITTER,
                class: "fa-brands fa-x-twitter fa-xl footer-icon",
                testId: "twitter-icon",
              }}
            />
            <Icon 
              opts = {{
                padding: "px-2",
                url: ICONS.INSTAGRAM,
                class: "fa-brands fa-instagram fa-xl footer-icon fa-xl footer-icon",
                testId: "instagram-icon",
              }}
            />
            <Nextdoor 
              opts = {{
                padding: "px-2",
                url: ICONS.NEXTDOOR,
                testId: "nextdoor-icon",
              }}
            />
          </div>
        </div>
        <div className="col-sm mb-4 d-flex justify-content-center align-items-center">
          <img src={circleLogo} alt="a fox holding a wrench representing the logo of cleanfix services" className="img-fluid"/>
        </div>

      </div>
      <div className='d-flex flex-grow-1 justify-content-center pb-4 copyright'>
        © 2024 CleanFix Services, LLC
      </div>
    </footer>
  )
}

export default Footer

