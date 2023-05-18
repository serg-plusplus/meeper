import { AlertTriangle } from "lucide-react";

import { NoStreamError } from "../core/meeper";

import { Alert, AlertTitle, AlertDescription } from "./ui/alert";

export default function FatalError({
  error,
}: {
  error: Error | string | null;
}) {
  const noStreamError = error instanceof NoStreamError;

  return (
    <div className="min-h-screen px-4 flex flex-col items-center justify-center">
      <Alert className="max-w-[40rem] prose prose-slate">
        <AlertTriangle className="h-6 w-6 stroke-yellow-600" />
        <AlertTitle className="ml-2">
          {noStreamError ? "Try a new one" : "Failed"}
        </AlertTitle>
        <AlertDescription className="ml-2">
          {noStreamError ? (
            <>
              <p>
                It is not possible to continue prevous transcripts. Please start
                a new one.
              </p>

              <p>
                You can find previous transcripts by opening the Meeper popup.
                To do this, find the Meeper icon in the browser toolbar and
                click on this icon.
              </p>
            </>
          ) : typeof error === "string" ? (
            error
          ) : (
            error?.message ?? "Something went wrong."
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
