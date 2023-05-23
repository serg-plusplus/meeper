import {
  registerInpageScripts,
  registerContextMenus,
} from "./config/extRegister";
import { startBgWorker } from "./core/bgWorker";

registerInpageScripts();
registerContextMenus();

startBgWorker();

if (process.env.NODE_ENV === "development") {
  import("./_dev/hotreloadObserver")
    .then(({ initHotReloadTab }) => initHotReloadTab())
    .catch(console.error);
}
