import NavBar from "./NavBar";
import Footer from "./Footer"
import ActionBar from "./ActionBar";
import { Outlet } from 'react-router-dom';

const App = () => {
  return (
    <div className="App">
      <NavBar />
      <main>
        <Outlet/>
      </main>
      <Footer/>
      <ActionBar/>
    </div>
  );
}

export default App;
