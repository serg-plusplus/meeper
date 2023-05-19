import { registerInpageScripts } from "./config/inpageScripts";
import { startBgWorker } from "./core/bgWorker";

registerInpageScripts();
startBgWorker();

if (process.env.NODE_ENV === "development") {
  import("./_dev/hotreloadObserver")
    .then(({ initHotReloadTab }) => initHotReloadTab())
    .catch(console.error);
}
