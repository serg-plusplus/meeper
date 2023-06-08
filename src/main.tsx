import { mount } from "./app/root";
import { RouteProvider } from "./app/mainRoutes";
import MainRouter from "./components/MainRouter";
import { ApiKeyDialogProvider } from "./components/ApiKeyDialog";

mount(
  <RouteProvider>
    <ApiKeyDialogProvider>
      <MainRouter />
    </ApiKeyDialogProvider>
  </RouteProvider>
);
