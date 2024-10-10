import Service from "./Service";
import servicesData from "./servicesData";
import './Home.css'

const Home = () => {
  const services = servicesData.map(service => <Service key={service.name} service={service} />)
  return (
    <div>
      <h1>Home</h1>
      <p>This is the Home page</p>
      <div className="d-flex flex-wrap justify-content-center home-containter">
        { services }
      </div>

    </div>
  );
 }
  export default Home