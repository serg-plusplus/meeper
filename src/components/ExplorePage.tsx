import { useState, useEffect, useCallback } from "react";
import classNames from "clsx";
import { Loader2 } from "lucide-react";

import { getSummary } from "../lib/summary";
import { DBContent, DBRecord, dbContents, dbRecords } from "../core/db";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";

import Header from "./Header";
import FatalError from "./FatalError";
import PrettyDate, { getPrettyDuration } from "./PrettyDate";
import { Button } from "./ui/button";

export default function ExplorePage({ recordId }: { recordId: string }) {
  const [_loading, setLoading] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [record, setRecord] = useState<DBRecord & DBContent>();
  const [fatalError, setFatalError] = useState<Error | string | null>(null);

  const fetchRecord = useCallback(async () => {
    const [dbRecord, dbContent] = await Promise.all([
      dbRecords.get(recordId),
      dbContents.get(recordId),
    ]);

    if (!dbRecord || !dbContent) throw new Error("Not Found");

    return { ...dbRecord, ...dbContent };
  }, [recordId]);

  useEffect(() => {
    setLoading(true);

    fetchRecord()
      .then(setRecord)
      .catch(setFatalError)
      .finally(() => setLoading(false));
  }, [fetchRecord]);

  const generateSummary = useCallback(async () => {
    if (!record) return;

    if (generatingSummary) return;
    setGeneratingSummary(true);

    try {
      const summary = await getSummary(content);
      await dbContents.update(record.id, { summary }).catch(console.error);

      setRecord({ ...record, summary });
    } catch (err: any) {
      console.error(err);
      alert(err?.message);
    }

    setGeneratingSummary(false);
  }, [record, generatingSummary]);

  if (fatalError) {
    return <FatalError error={fatalError} />;
  }

  if (!record) {
    return null;
  }

  const { tab, content, createdAt, lastSyncAt, finishedAt, summary } = record;
  const durationEndDate = finishedAt ?? lastSyncAt ?? Date.now();

  return (
    <div className={classNames("min-h-screen flex flex-col")}>
      <Header
        tab={tab}
        toolbar={
          <div className="flex flex-col items-end justify-between">
            <Badge variant="outline" className="rounded-sm">
              {getPrettyDuration(createdAt, durationEndDate)}
            </Badge>
            <span className="mt-1 text-xs leading-none text-muted-foreground whitespace-nowrap">
              <PrettyDate date={createdAt} />
            </span>
          </div>
        }
      />

      <main className="flex-1 container mx-auto max-w-3xl px-4 py-8 grow bg-white">
        <article className="prose prose-slate mx-auto pb-48">
          {content.length > 0 ? (
            <>
              <h2>Summary</h2>

              {summary ? (
                <p>{summary}</p>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="my-0">
                      AI-powered Transcript Summarization! 🚀✨
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="-mt-2">
                    <CardDescription className="text-sm text-foreground">
                      Unlock the power of artificial intelligence to generate
                      summaries for your transcripts effortlessly. You can now
                      distill lengthy transcripts into concise summaries in no
                      time.
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="flex">
                    <Button
                      type="button"
                      disabled={generatingSummary}
                      onClick={() => generateSummary()}
                    >
                      {!generatingSummary ? (
                        "Genearate summary"
                      ) : (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )}

              <h2>Transcription</h2>

              {content.map((item, i) => (
                <p key={i}>{item}</p>
              ))}
            </>
          ) : (
            "No content."
          )}
        </article>
      </main>
    </div>
  );
}
