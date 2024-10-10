import {
  createBrowserRouter,
} from "react-router-dom";

import About from '../pages/About';
import App from "../App";
import Calculators from '../pages/Calculators';
import Home from '../pages/home/Home';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // Use App as the layout component
    children: [
      {
        path: "/about",
        element: <About />,
      },
      {
        path: "/calculators",
        element: <Calculators />,
      },
      {
        path: "/",
        exact: true,
        element: <Home />,
      },
    ],
  },
]);

export default router

