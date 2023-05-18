import classNames from "clsx";
import { useLiveQuery } from "dexie-react-hooks";
import { dbRecords } from "../core/db";
import { buildMainURL } from "../config/extUrl";
import PrettyDate from "./PrettyDate";

export default function History() {
  const records = useLiveQuery(() =>
    dbRecords.orderBy("createdAt").reverse().toArray()
  );

  return (
    <div className="px-4 flex flex-col gap-4">
      {records &&
        records.map((rec) => (
          <div
            key={rec.id}
            className={classNames(
              "border-t-1 border-gray-400 first:border-none"
            )}
          >
            <div className="flex items-center">
              <span className="relative flex h-6 w-6 shrink-0 overflow-hidden">
                <img
                  src={rec.tab.favIconUrl}
                  alt=""
                  className="aspect-square h-full w-full"
                />
              </span>

              <span className="ml-2 max-w-[10rem] truncate">
                {rec.tab.title}
              </span>

              <span className="flex-1" />

              <a
                href={buildMainURL(`/explore/${rec.id}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Open
              </a>
            </div>

            <div className="flex items-end">
              <a
                href={rec.tab.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {rec.tab.url
                  .replace(/^(?:(ht|f)tp(s?)\:\/\/)?/, "")
                  .replace("www.", "")}
              </a>

              <span className="flex-1"></span>

              <span>
                <PrettyDate date={rec.createdAt} />
              </span>
            </div>
          </div>
        ))}
    </div>
  );
}
