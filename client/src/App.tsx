import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import Login from "./pages/login";
import Game from "./pages/Game";
import Home from "./pages/home";

import "./App.css";

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/">
        <Route index element={<Home />} />
        <Route path={"/:id"} element={<Game />} />
        <Route path={"/login"} element={<Login />} />
      </Route>
    )
  );

  return <RouterProvider router={router} />;
}

export default App;
