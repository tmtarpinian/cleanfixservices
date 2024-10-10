import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './Service.css'

const Service = ({service}) => {
  const { name, summary, path, source, alt } = service
  return (
    <div className="col-12 col-md-6 col-lg-3 service-image">
      <div className="d-flex justify-content-center">
        <div className="d-flex flex-column">
          <div className="image-wrapper">
            <img src={source} alt={alt} className='service-image'/>
          </div>
          <div>
            <h3>{name}</h3>
          </div>
          <div>
            <p>{summary}</p>
          </div>
          <div>
            <Link to={path} className="link">Book Now</Link>
            <span>
            <i class="fa-solid fa-arrow-right" style={{color: "#FFFFFF"}}></i>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Service