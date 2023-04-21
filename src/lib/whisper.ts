const dbVersion = 1;
const dbName = "meeper_main";

export async function loadWhisper(
  modelUrl: string,
  modelSize: number,
  onProgress?: (p: number) => void,
  log?: (m: string) => void
) {
  // Load Whisper core, includes WASM inside
  const { default: moduleFactory } = await import(
    new URL("/whisper/main.js", location.origin).toString()
  );

  // Assign meta event handlers for module
  const Module = await moduleFactory({
    print: log,
    printErr: log,
    setStatus: (text: string) => {
      log?.("whisper: " + text);
    },
    preRun: () => {
      log?.("whisper: Preparing ...");
    },
    postRun: () => {
      log?.("whisper: Initialized successfully!");
    },
  });

  await new Promise<void>((res, rej) => {
    loadRemote(
      modelUrl,
      "whisper.bin",
      modelSize,
      (fname: string, buf: Uint8Array) => {
        // write to WASM file using FS_createDataFile
        // if the file exists, delete it
        try {
          Module.FS_unlink(fname);
        } catch (e) {
          // ignore
        }

        Module.FS_createDataFile("/", fname, buf, true, true);

        res();
        log?.("storeFS: stored model: " + fname + " size: " + buf.length);
      },
      () => rej(new Error("Failed to load Whisper artifacts.")),
      onProgress,
      log
    );
  });

  return Module;
}

export async function clearCache() {
  if (
    confirm(
      "Are you sure you want to clear the cache?\nAll the models will be downloaded again."
    )
  ) {
    indexedDB.deleteDatabase(dbName);
  }
}

// load remote data
// - check if the data is already in the IndexedDB
// - if not, fetch it from the remote URL and store it in the IndexedDB
function loadRemote(
  url: string,
  dst: string,
  size_mb: number,
  cbReady: (dst: string, r: any) => void,
  cbCancel: () => void,
  cbProgress?: (p: number) => void,
  cbPrint?: (m: string) => void
) {
  if (!navigator.storage || !navigator.storage.estimate) {
    cbPrint?.("loadRemote: navigator.storage.estimate() is not supported");
  } else {
    // query the storage quota and print it
    navigator.storage.estimate().then((estimate) => {
      cbPrint?.("loadRemote: storage quota: " + estimate.quota + " bytes");
      cbPrint?.("loadRemote: storage usage: " + estimate.usage + " bytes");
    });
  }

  // check if the data is already in the IndexedDB
  const rq = indexedDB.open(dbName, dbVersion);

  rq.onupgradeneeded = (event: any) => {
    const db = event.target.result;
    if (db.version == 1) {
      db.createObjectStore("models", { autoIncrement: false });
      cbPrint?.(
        "loadRemote: created IndexedDB " + db.name + " version " + db.version
      );
    } else {
      // clear the database
      const os = event.currentTarget.transaction.objectStore("models");
      os.clear();
      cbPrint?.(
        "loadRemote: cleared IndexedDB " + db.name + " version " + db.version
      );
    }
  };

  rq.onsuccess = (event: any) => {
    const db = event.target.result;
    const tx = db.transaction(["models"], "readonly");
    const os = tx.objectStore("models");
    const rq = os.get(url);

    rq.onsuccess = () => {
      if (rq.result) {
        cbPrint?.('loadRemote: "' + url + '" is already in the IndexedDB');
        cbReady(dst, rq.result);
      } else {
        // data is not in the IndexedDB
        cbPrint?.('loadRemote: "' + url + '" is not in the IndexedDB');

        // alert and ask the user to confirm
        // if (
        //   !confirm(
        //     "You are about to download " +
        //       size_mb +
        //       " MB of data.\n" +
        //       "The model data will be cached in the browser for future use.\n\n" +
        //       "Press OK to continue."
        //   )
        // ) {
        //   cbCancel();
        //   return;
        // }

        fetchRemote(url, cbProgress, cbPrint).then((data) => {
          if (data) {
            // store the data in the IndexedDB
            const rq = indexedDB.open(dbName, dbVersion);
            rq.onsuccess = (event: any) => {
              const db = event.target.result;
              const tx = db.transaction(["models"], "readwrite");
              const os = tx.objectStore("models");
              const rq = os.put(data, url);

              rq.onsuccess = () => {
                cbPrint?.('loadRemote: "' + url + '" stored in the IndexedDB');
                cbReady(dst, data);
              };

              rq.onerror = () => {
                cbPrint?.(
                  'loadRemote: failed to store "' + url + '" in the IndexedDB'
                );
                cbCancel();
              };
            };
          }
        });
      }
    };

    rq.onerror = () => {
      cbPrint?.("loadRemote: failed to get data from the IndexedDB");
      cbCancel();
    };
  };

  rq.onerror = () => {
    cbPrint?.("loadRemote: failed to open IndexedDB");
    cbCancel();
  };

  rq.onblocked = () => {
    cbPrint?.("loadRemote: failed to open IndexedDB: blocked");
    cbCancel();
  };
}

// fetch a remote file from remote URL using the Fetch API
async function fetchRemote(
  url: string,
  cbProgress?: (p: number) => void,
  cbPrint?: (m: string) => void
) {
  cbPrint?.("fetchRemote: downloading with fetch()...");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/octet-stream",
    },
  });

  if (!response.ok) {
    cbPrint?.("fetchRemote: failed to fetch " + url);
    return;
  }

  const contentLength = response.headers.get("content-length");
  const total = parseInt(contentLength!, 10);
  const reader = response.body!.getReader();

  const chunks = [];
  let receivedLength = 0;
  let progressLast = -1;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    receivedLength += value.length;

    if (contentLength) {
      cbProgress?.(receivedLength / total);

      var progressCur = Math.round((receivedLength / total) * 10);
      if (progressCur != progressLast) {
        cbPrint?.("fetchRemote: fetching " + 10 * progressCur + "% ...");
        progressLast = progressCur;
      }
    }
  }

  let position = 0;
  const chunksAll = new Uint8Array(receivedLength);

  for (const chunk of chunks) {
    chunksAll.set(chunk, position);
    position += chunk.length;
  }

  return chunksAll;
}
