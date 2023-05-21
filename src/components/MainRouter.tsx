import { useEffect } from "react";
import { match } from "ts-pattern";

import { useRoute } from "../app/mainRoutes";
import ExplorePage from "./ExplorePage";
import RecordPage from "./RecordPage";
import SettingsPage from "./SettingsPage";

export default function MainRouter() {
  const route = useRoute();

  return match(route)
    .with({ name: "explore" }, (r) => <ExplorePage {...r.params} />)
    .with({ name: "record" }, (r) => <RecordPage {...r.params} />)
    .with({ name: "settings" }, () => <SettingsPage />)
    .otherwise(() => <CloseTab />);
}

function CloseTab() {
  useEffect(() => {
    window.close();
  }, []);

  return null;
}
