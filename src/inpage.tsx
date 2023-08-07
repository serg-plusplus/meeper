import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  useFloating,
  useHover,
  useInteractions,
  safePolygon,
  offset,
  flip,
  shift,
  autoUpdate,
} from "@floating-ui/react";

import MEEPER_ICON_BASE64 from "./config/meeperIconBase64";
import RecordSpinner from "./components/RecordSpinner";

injectAndRetry();

function injectAndRetry() {
  try {
    injectMeeperButton();
  } catch {}

  setTimeout(injectAndRetry, 1_000);
}

function injectMeeperButton() {
  const micNode = document.querySelectorAll("button[data-is-muted]")![0];
  const toolbarNode =
    micNode.parentNode!.parentNode!.parentNode!.parentNode!.parentNode!;

  // Already injected
  if (
    (toolbarNode.firstChild as HTMLButtonElement)?.dataset?.meeper === "true"
  ) {
    return;
  }

  // Preview screen
  if (toolbarNode.childNodes.length < 3) return;

  trackMuted(micNode as HTMLButtonElement);

  const meeperContainer = document.createElement("div");
  meeperContainer.dataset.meeper = "true";

  toolbarNode.prepend(meeperContainer);
  const root = createRoot(meeperContainer);

  root.render(
    <MeeperButton
      unmount={() => {
        meeperContainer.style.display = "none";
      }}
    />,
  );
}

const INITIAL_REC_STATE = {
  active: false,
  recording: false,
};

function MeeperButton({ unmount }: { unmount: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [{ active, recording }, setRecState] = useState(INITIAL_REC_STATE);
  const [finishing, setFinishing] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "top",
    middleware: [
      offset(10),
      flip({ fallbackAxisSideDirection: "end" }),
      shift(),
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    handleClose: safePolygon(),
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  useEffect(() => trackState(setRecState), []);

  return (
    <>
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        type="button"
        id="__meeper_toggle"
        className="__meeper_button_reset __meeper_button"
        style={{
          backgroundImage: `url('${MEEPER_ICON_BASE64}')`,
        }}
        aria-describedby="__meeper_tooltip"
        data-meeper="true"
      />

      {isOpen && (
        <div
          ref={refs.setFloating}
          {...getFloatingProps()}
          role="tooltip"
          id="__meeper_tooltip"
          className="__meeper_tooltip"
          style={floatingStyles}
        >
          <span style={{ fontWeight: 600 }}>
            {(() => {
              switch (true) {
                case finishing:
                  return "Finishing...";

                case recording:
                  return (
                    <span
                      style={{ display: "inline-flex", alignItems: "center" }}
                    >
                      <RecordSpinner
                        style={
                          {
                            marginRight: "0.5rem",
                            ["--boxHeight"]: "12px",
                            ["--boxBg"]: "#16a34a",
                          } as any
                        }
                      />
                      LIVE
                    </span>
                  );

                case active:
                  return "Paused.";

                default:
                  return "📑 Transcribe and summarize this meet!";
              }
            })()}
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "0.5rem",
              marginBottom: !active ? "0.5rem" : "1rem",
              ...(finishing
                ? {
                    opacity: "0.5",
                    pointerEvents: "none",
                  }
                : {}),
            }}
          >
            {!active ? (
              <>
                <span style={{ marginRight: "0.5rem" }}>Press:</span>
                <span className="__meeper_kbd">{isMac() ? "⌘" : "Ctrl"}</span>
                <span
                  style={{
                    fontWeight: 600,
                    marginLeft: "0.15rem",
                    marginRight: "0.15rem",
                    opacity: 0.75,
                  }}
                >
                  +
                </span>
                <span className="__meeper_kbd">⇧</span>
                <span
                  style={{
                    fontWeight: 600,
                    marginLeft: "0.15rem",
                    marginRight: "0.15rem",
                    opacity: 0.75,
                  }}
                >
                  +
                </span>
                <span className="__meeper_kbd">0</span>
              </>
            ) : (
              <>
                <button
                  className="__meeper_button_reset __meeper_kbd"
                  style={{ marginRight: "0.5rem", padding: "4px 0.5rem" }}
                  onClick={() => sendMessage({ type: "focus" })}
                >
                  Open
                </button>

                <button
                  className="__meeper_button_reset __meeper_kbd"
                  style={{ marginRight: "0.5rem", fontSize: 18 }}
                  onClick={() =>
                    sendMessage({ type: recording ? "pause" : "start" })
                  }
                >
                  {recording ? "⏸" : "⏵"}
                </button>

                <button
                  className="__meeper_button_reset __meeper_kbd"
                  style={{ fontSize: 18 }}
                  onClick={() => {
                    sendMessage({ type: "stop" });
                    setFinishing(true);
                    setTimeout(() => setFinishing(false), 2_500);
                  }}
                >
                  ⏹
                </button>
              </>
            )}
          </div>

          <button
            className="__meeper_button_reset __meeper_hide_button"
            onClick={() => unmount()}
          >
            Hide Meeper
          </button>
        </div>
      )}
    </>
  );
}

const trackState = (callback: (data: any) => void) => {
  // Listen messages from ContentScript
  const handleMessage = (evt: MessageEvent) => {
    if (
      evt.source === window &&
      evt.origin === location.origin &&
      evt.data?.target === "meeper" &&
      evt.data?.to === "inpage"
    ) {
      callback(evt.data);
    }
  };

  window.addEventListener("message", handleMessage, false);
  return () => window.removeEventListener("message", handleMessage, false);
};

const trackMuted = (micNode: HTMLButtonElement) => {
  const isMuted = () => micNode.dataset?.isMuted === "true";

  let latest = isMuted();

  const checkAndDefer = () => {
    const current = isMuted();

    if (current !== latest) {
      latest = current;

      sendMessage({
        type: "setmic",
        enabled: !current,
      });
    }

    setTimeout(checkAndDefer, 500);
  };

  checkAndDefer();
};

const sendMessage = (msg: Record<string, any>) => {
  window.postMessage(
    {
      target: "meeper",
      to: "content",
      ...msg,
    },
    location.origin,
  );
};

function isMac() {
  return navigator.platform?.toUpperCase().includes("MAC");
}
