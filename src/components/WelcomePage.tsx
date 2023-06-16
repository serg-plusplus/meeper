import classNames from "clsx";

import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { useApiKeyState } from "./ApiKeyDialog";

export default function WelcomePage() {
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

        <div className={classNames("flex flex-col", "mt-12 ml-12")}>
          <span className="text-lg font-semibold text-muted-foreground opacity-75">
            Welcome to
          </span>
          <span className="text-5xl font-bold text-foreground">Meeper</span>
          <span className="mt-6 text-sm font-semibold text-muted-foreground">
            Get ready to unlock a new level of productivity!
          </span>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl">
        <Separator orientation="horizontal" className="h-px w-full" />
      </div>

      <article className="my-8 w-full prose prose-slate">
        <h2>Getting started</h2>

        <ol
          style={{ ["--tw-prose-counters"]: "var(--tw-prose-headings)" } as any}
        >
          <li>
            Get your API key from{" "}
            <a
              className="text-blue-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              href="https://platform.openai.com/account/api-keys"
            >
              Open AI dashboard
            </a>
            .
          </li>

          <li>
            <div className="flex items-center">
              <Button
                type="button"
                onClick={() => openApiKeyDialog()}
                disabled={apiKeyEntered}
                className="disabled:opacity-50"
              >
                Enter API Key
              </Button>

              {apiKeyEntered && (
                <div className="ml-4">✅ Successfully entered.</div>
              )}
            </div>
          </li>

          <li>
            Pin Meeper in browser toolbar!
            <img
              src="/misc/chrome_toolbar.png"
              alt=""
              className="w-[20rem] h-auto"
            />
          </li>

          <li>
            Start using the app!{" "}
            <img
              src="/misc/start_toolbar.png"
              alt=""
              className="w-[20rem] h-auto"
            />
          </li>

          <li>You can safely close this page.</li>
        </ol>
      </article>
    </div>
  );
}
