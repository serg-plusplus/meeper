import { mount } from "./app/root";
import { RouteProvider } from "./app/mainRoutes";

import MainRouter from "./components/MainRouter";
import { ApiKeyDialogProvider } from "./components/ApiKeyDialog";
import { Toaster } from "./components/ui/toaster";

mount(
  <RouteProvider>
    <ApiKeyDialogProvider>
      <MainRouter />
    </ApiKeyDialogProvider>

    <Toaster />
  </RouteProvider>
);
