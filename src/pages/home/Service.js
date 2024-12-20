import { Link } from 'react-router-dom'
import './Service.css'
import { ICONS } from '../../constants'

const Service = ({ service }) => {
  const { name, summary, source, alt } = service // TODO: add path when pages built
  return (
    <div className="col-12 col-md-6 col-lg-3 service-image">
      <div className="d-flex justify-content-center">
        <div className="d-flex flex-column">
          <div className="image-wrapper">
            <img src={source} alt={alt} className='service-image'/>
          </div>
          <div className="copy-container mx-1">
            <div>
              <h3 className="mt-5">{name}</h3>
            </div>
            <div>
              <p className="service-summary">{summary}</p>
            </div>
            <div className="mb-3">
              {/* <Link to={path} className="link">Book Now</Link> */}
              <Link to={ICONS.FACEBOOK } className="link">Book Now</Link>
              <span>
              <i className="fa-solid fa-arrow-right mx-1 book-now-arrow"></i>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Service