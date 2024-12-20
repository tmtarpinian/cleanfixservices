import { Link } from 'react-router-dom'
import './Home.css'
import { ICONS } from "../../constants";
import checklist from '../../assets/checklist.jpg'
import Service from "./Service";
import servicesData from "./servicesData";

const Home = () => {
  const services = servicesData.map(service => <Service key={service.name} service={service} />)
  return (
    <>
      <div className="d-flex justify-contents-center align-items-center">
        <div className="row m-auto home-banner-row">
          <div className="col pt-4 m-0 m-md-auto">
            <div className="d-flex flex-row justify-content-center align-items-center mb-0">
              fix
              <i className="fa-solid fa-2xs fa-star mx-1 shaking-icon"></i>
              organize
              <i className="fa-solid fa-2xs fa-star mx-1 shaking-icon"></i>
              clean
            </div>
            <p className="homepage-title mb-0">Check those items</p>
            <p className="homepage-title mb-0">off your Todo List</p>
            <div className="d-flex justify-content-center mt-3">
                <Link to={ ICONS.FACEBOOK } className="btn btn-lg btn-primary mb-4" role="button">Book Now</Link>
            </div>
          </div>
          <div className="d-none d-md-block col p-0">
            {/* image size is 1066x600 */}
            <img src={checklist} className="img-fluid" alt="a checklist written on a notepad"/>
          </div>
        </div>
      </div>
      <div className="flex-row">
        <div className="d-flex flex-wrap justify-content-center services-containter">
          { services }
        </div>
      </div>
    </>
  );
 }
  export default Home