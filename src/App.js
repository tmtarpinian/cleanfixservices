import NavBar from "./NavBar";
import Footer from "./Footer"
import { Outlet } from 'react-router-dom';

const App = () => {
  return (
    <div className="App">
      <NavBar />
      <Outlet/>
      <Footer/>
    </div>
  );
}

export default App;
