import { mount } from "./app/root";
import { RouteProvider } from "./app/mainRoutes";
import MainRouter from "./components/MainRouter";

mount(
  <RouteProvider>
    <MainRouter />
  </RouteProvider>
);
