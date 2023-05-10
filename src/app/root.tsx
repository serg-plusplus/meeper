import { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { disableOutlinesForClick } from "../lib/outline-on-click";

export function mount(app: ReactNode) {
  disableOutlinesForClick();

  const root = createRoot(document.getElementById("root")!);
  root.render(<>{app}</>);
}
