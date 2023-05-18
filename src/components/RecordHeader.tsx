import { useMemo } from "react";
import classNames from "clsx";
import {
  PauseIcon,
  PlayIcon,
  PowerIcon,
  // Edit3,
} from "lucide-react";
import { useChromeStorageSession } from "use-chrome-storage";
import { match, P } from "ts-pattern";

import type { MeeperRecorder } from "../core/meeper";
import { LANGCODE } from "../core/session";
import { WHISPER_LANG_LIST } from "../config/lang";

import { Button } from "./ui/button";

import Header from "./Header";
import LanguageSelect from "./LanguageSelect";
import { RecordType } from "../core/types";

export default function RecordHeader({
  meeper,
  recordType,
  recording,
}: {
  meeper: MeeperRecorder;
  recordType: RecordType;
  recording: boolean;
}) {
  const [langCode, setLangCode] = useChromeStorageSession(LANGCODE, "auto");

  const streamActive = meeper?.stream?.active;

  const statusText = useMemo(
    () =>
      match([recordType, recording, streamActive])
        .with(
          [P.any, P.any, false],
          () => "Transcribing finished. Saving and closing..."
        )
        .with([P.any, false, P.any], () => "Paused. Click button to continue")
        .with(
          [RecordType.Full, true, P.any],
          () => "Transcribing using tab audio and microphone..."
        )
        .with(
          [RecordType.StereoOnly, true, P.any],
          () => "Transcribing using tab audio..."
        )
        .otherwise(() => ""),
    [recordType, recording, streamActive]
  );

  /**
   * Toolbar
   */

  const toolbar = (
    <div className={classNames("ml-4 lg:ml-8 flex items-center")}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mr-2"
        disabled={!streamActive}
        onClick={() => (recording ? meeper.pause() : meeper.start())}
      >
        {recording || !streamActive ? (
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
        disabled={!streamActive}
        onClick={() => meeper.stop()}
      >
        <PowerIcon className="mr-2 h-5 w-auto" />
        Stop
      </Button>
    </div>
  );

  /**
   * Sub header
   */

  const subHeader = (
    <div
      className={classNames(
        "bg-accent border border-t-0 border-border",
        "px-4 py-2",
        "container max-w-3xl",
        "flex items-center",
        "min-w-0",
        "rounded-b-md"
      )}
    >
      <span
        className={classNames(
          "text-xs text-muted-foreground font-medium",
          "inline-flex items-center"
        )}
      >
        {/* <Edit3 className="h-4 w-auto opacity-75 mr-2 animate-wiggle" /> */}

        {recording && (
          <div className="rw_spinner__container opacity-75 mr-2">
            <div className="rw_spinner rw_spinner__1" />
            <div className="rw_spinner rw_spinner__2" />
            <div className="rw_spinner rw_spinner__3" />
            <div className="rw_spinner rw_spinner__4" />
            <div className="rw_spinner rw_spinner__5" />
          </div>
        )}

        {statusText}
      </span>
      <div className="flex-1" />

      <div className="flex items-center space-x-2">
        <p className="text-xs text-muted-foreground font-medium">Language</p>

        <LanguageSelect
          langList={WHISPER_LANG_LIST}
          selectedLangCode={langCode}
          onLangSelected={setLangCode}
        />
      </div>
    </div>
  );

  return <Header tab={meeper.tab} toolbar={toolbar} subHeader={subHeader} />;
}
