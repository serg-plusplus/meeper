import { useState } from "react";
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

  trackState();
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
    />
  );
}

function MeeperButton({ unmount }: { unmount: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

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

  return (
    <>
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        type="button"
        id="__meeper_toggle"
        className="__meeper_button"
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
            Transcribe and summarize this meet!
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <span style={{ marginRight: "0.5rem" }}>Press:</span>
            <span className="__meeper_kbd">{isMac() ? "⌘" : "Ctrl"}</span>
            <span
              style={{
                fontWeight: 600,
                marginLeft: "0.25rem",
                marginRight: "0.25rem",
              }}
            >
              +
            </span>
            <span className="__meeper_kbd">0</span>
          </div>

          <button className="__meeper_hide_button" onClick={() => unmount()}>
            Hide Meeper
          </button>
        </div>
      )}
    </>
  );
}

const trackState = () => {
  // Listen messages from ContentScript
  window.addEventListener(
    "message",
    (evt) => {
      if (
        evt.source === window &&
        evt.origin === location.origin &&
        evt.data?.target === "meeper" &&
        evt.data?.to === "inpage"
      ) {
        console.info(evt.data);
      }
    },
    false
  );
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
    location.origin
  );
};

function isMac() {
  return navigator.platform?.toUpperCase().includes("MAC");
}
