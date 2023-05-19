import { memo, useEffect, useRef, useState } from "react";
import classNames from "clsx";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronRightIcon } from "lucide-react";

import { DBRecord, fetchRecords } from "../core/db";
import { buildMainURL } from "../config/extUrl";

import TabAvatar from "./TabAvatar";
import PrettyDate, { getPrettyDuration } from "./PrettyDate";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import RecordSpinner from "./RecordSpinner";

const HistoryItem = memo(
  ({
    record: { id, tab, createdAt, finishedAt, recordTabId },
    lastItem,
  }: {
    record: DBRecord;
    lastItem?: boolean;
  }) => {
    const handleClick = async () => {
      if (!finishedAt && recordTabId) {
        await chrome.tabs.update(recordTabId, { active: true });
        return;
      }

      await chrome.tabs.create({
        url: buildMainURL(`/explore/${id}`),
        active: true,
      });
    };

    return (
      <>
        <button
          type="button"
          className={classNames(
            "relative group",
            "w-full p-2 pr-8 mb-2",
            "flex items-center text-left",
            "min-w-0",
            "rounded-md",
            "hover:bg-muted",
            "transition-color ease-in-out duration-200"
          )}
          onClick={handleClick}
        >
          <TabAvatar tab={tab} className="mr-3" />

          <div className="flex items-center justify-end w-full min-w-0">
            <div
              className={classNames(
                "truncate mr-auto text-sm font-semibold leading-none"
              )}
            >
              {tab.title}

              <div className="mt-1 flex items-center justify-start min-w-0">
                <Badge variant="outline" className="rounded-sm">
                  {finishedAt ? (
                    getPrettyDuration(createdAt, finishedAt)
                  ) : (
                    <span className="inline-flex items-center">
                      <RecordSpinner
                        className="mr-2"
                        style={
                          {
                            ["--boxHeight"]: "12px",
                            ["--boxBg"]: "#16a34a",
                          } as any
                        }
                      />
                      LIVE
                    </span>
                  )}
                </Badge>

                <span className="ml-2 text-xs font-normal leading-none text-muted-foreground whitespace-nowrap">
                  <PrettyDate date={createdAt} />
                </span>
              </div>
            </div>

            <div>
              <ChevronRightIcon
                className={classNames(
                  "text-muted-foreground",
                  "w-6 h-auto",
                  "absolute right-2.5 top-1/2 -translate-y-1/2",
                  "transition",
                  "group-hover:translate-x-0 group-hover:opacity-100",
                  "-translate-x-1.5 opacity-0"
                )}
              />
            </div>
          </div>
        </button>

        {!lastItem && (
          <div className="mb-2 px-2">
            <Separator />
          </div>
        )}
      </>
    );
  }
);

const ITEMS_PER_PAGE = 20;

export default function History() {
  const [limit, setLimit] = useState(ITEMS_PER_PAGE);
  const infiniteScrollAnchorRef = useRef<HTMLDivElement>(null);
  const recordsLengthRef = useRef<number>();

  const records = useLiveQuery(() => fetchRecords(limit), [limit]);

  useEffect(() => {
    recordsLengthRef.current = records?.length;
  }, [records?.length]);

  useEffect(() => {
    const target = infiniteScrollAnchorRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLimit((currentLimit) => {
            if (
              !recordsLengthRef.current ||
              currentLimit > recordsLengthRef.current
            ) {
              return currentLimit;
            }

            return currentLimit + ITEMS_PER_PAGE;
          });
        }
      },
      { threshold: 1 }
    );

    observer.observe(target);

    return () => observer.unobserve(target);
  }, [setLimit]);

  return (
    <div className="px-2 flex flex-col">
      {records &&
        records.map((rec, i, arr) => (
          <HistoryItem
            key={rec.id}
            record={rec}
            lastItem={i === arr.length - 1}
          />
        ))}

      <div ref={infiniteScrollAnchorRef} className="pb-8" />
    </div>
  );
}
