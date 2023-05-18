import classNames from "clsx";
import { AppWindowIcon, PauseIcon, PlayIcon, PowerIcon } from "lucide-react";

import type { MeeperRecorder } from "../core/meeper";

import { Separator } from "./ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";

export default function RecordHeader({
  recording,
  meeper,
}: {
  recording: boolean;
  meeper?: MeeperRecorder;
}) {
  return (
    <header className="sticky top-0 w-full">
      <nav
        className={classNames(
          "h-16 container max-w-3xl px-4 bg-white",
          "flex items-center",
          "min-w-0"
        )}
      >
        {meeper && (
          <>
            <Avatar className="h-8 w-auto rounded-none mr-4">
              <AvatarImage src={meeper.tab.favIconUrl} alt="" />
              <AvatarFallback className="rounded-none bg-transparent">
                <AppWindowIcon className="h-full w-auto" />
              </AvatarFallback>
            </Avatar>

            <div className="flex items-center justify-end w-full min-w-0">
              <span className="truncate mr-auto text-base font-semibold leading-7">
                {meeper.tab.title}
              </span>

              <div
                className={classNames(
                  "ml-4 lg:ml-8 flex items-center",
                  !meeper.stream.active && "invisible"
                )}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mr-2"
                  onClick={() => (recording ? meeper.pause() : meeper.start())}
                >
                  {recording ? (
                    <>
                      <PauseIcon className="mr-2 h-5 w-auto" />
                      Pause
                    </>
                  ) : (
                    <>
                      <PlayIcon className="mr-2 h-5 w-auto" />
                      Continue
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => meeper.stop()}
                >
                  <PowerIcon className="mr-2 h-5 w-auto" />
                  Stop
                </Button>
              </div>
            </div>
          </>
        )}
      </nav>

      <div className="px-4 lg:px-8">
        <Separator />
      </div>
    </header>
  );
}
