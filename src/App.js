import NavBar from "./NavBar";
import { Outlet } from 'react-router-dom';

const App = () => {
  return (
    <div className="App">
      <NavBar />
      <Outlet/>
    </div>
  );
}

export default App;
