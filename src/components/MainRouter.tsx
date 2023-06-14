import { useEffect } from "react";
import { match } from "ts-pattern";

import { RecordType } from "../core/types";

import { useRoute } from "../app/mainRoutes";
import ExplorePage from "./ExplorePage";
import RecordPage from "./RecordPage";
import SettingsPage from "./SettingsPage";
import WelcomePage from "./WelcomePage";

export default function MainRouter() {
  const route = useRoute();

  return match(route)
    .with({ name: "explore" }, (r) => <ExplorePage {...r.params} />)
    .with({ name: "record" }, (r) => (
      <RecordPage
        tabId={r.params.tabId}
        initialRecordType={r.params.recordType as RecordType}
      />
    ))
    .with({ name: "welcome" }, () => <WelcomePage />)
    .with({ name: "settings" }, () => <SettingsPage />)
    .otherwise(() => <CloseTab />);
}

function CloseTab() {
  useEffect(() => {
    window.close();
  }, []);

  return null;
}
