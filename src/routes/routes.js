import {
  createBrowserRouter,
} from "react-router-dom";

import App from "../App";
import Calculators from '../pages/calculators/Calculators';
import Contact from '../pages/contact/Contact';
import Home from '../pages/home/Home';
import Portfolio from '../pages/portfolio/Portfolio';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // Use App as the layout component
    children: [
      {
        path: "calculators",
        element: <Calculators />,
      },
      {
        path: "contact",
        element: <Contact />,
      },
      {
        path: "portfolio",
        element: <Portfolio />,
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
