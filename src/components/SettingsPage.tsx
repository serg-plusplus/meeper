import classNames from "clsx";

import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { useApiKeyState } from "./ApiKeyDialog";

export default function SettingsPage() {
  const { apiKeyEntered, openApiKeyDialog } = useApiKeyState();

  return (
    <div className={classNames("min-h-screen flex flex-col items-center")}>
      <div className="my-6 flex items-start select-none">
        <div
          className={classNames("w-[12rem] h-[12rem]", "bg-no-repeat bg-cover")}
          style={{
            backgroundImage: "url(/misc/meeper_winking_face.png)",
            backgroundSize: "100% auto",
          }}
        />

        <div className={classNames("flex flex-col", "mt-[4.5rem] ml-12")}>
          <span className="text-5xl font-bold text-foreground">Meeper</span>

          <span className="mt-4 text-xl font-semibold text-muted-foreground opacity-75">
            Settings
          </span>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl">
        <Separator orientation="horizontal" className="h-px w-full" />
      </div>

      <article className="my-8 w-full prose prose-slate">
        <h2>OpenAI API Key</h2>

        <p>
          Your API Key is stored locally on your browser and never sent anywhere
          else.
        </p>

        <div className="flex items-center">
          <Button type="button" onClick={() => openApiKeyDialog()}>
            {!apiKeyEntered ? "Enter API Key" : "Edit API Key"}
          </Button>

          {apiKeyEntered && <div className="ml-4">✅ Entered.</div>}
        </div>

        <h2>Links</h2>

        <ul>
          <li>
            Website:{" "}
            <a
              className="text-blue-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              href="https://meeper.ai"
            >
              meeper.ai
            </a>
          </li>

          <li>
            Github:{" "}
            <a
              className="text-blue-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/pas1ko/meeper"
            >
              pas1ko/meeper
            </a>
          </li>
        </ul>
      </article>
    </div>
  );
}
