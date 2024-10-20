import Service from "./Service";
import servicesData from "./servicesData";
import { Link } from 'react-router-dom'
import './Home.css'





import checklist from '../../assets/checklist.jpg'
import { FACEBOOK_PAGE } from "../../constants";

const Home = () => {
  const services = servicesData.map(service => <Service key={service.name} service={service} />)
  return (
    <>
      <div className="container-fluid p-0">
        <div className="row m-0 home-banner-row">
          <div className="col pt-4 m-md-auto">
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
                <Link to={ FACEBOOK_PAGE } className="btn btn-lg btn-primary mb-4" role="button">Book Now</Link>
            </div>
          </div>
          <div className="d-none d-md-block col p-0">
            {/* image size is 1066x600 */}
            <img src={checklist} className="img-fluid" alt="an axe in a tree stump"/>
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