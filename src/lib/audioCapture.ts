export const audioCapture = async (
  timeLimit = 20 * 60_000,
  muteTab = false,
  format = "wav",
  quality = 192,
  limitRemoved = false
) => {
  chrome.tabCapture.capture({ audio: true }, async (stream) => {
    // sets up stream for capture
    if (!stream) return;

    let timeout: any;
    let completeTabID: number; //tab when the capture is stopped
    let audioURL: string | null = null; //resulting object when encoding is completed

    const activeTabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    }); //saves start tab
    if (activeTabs.length === 0) return;

    const startTabId = activeTabs[0].id!; //tab when the capture is started

    const liveStream = stream;
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);

    let mediaRecorder = new Recorder(source); //initiates the recorder based on the current stream

    mediaRecorder.setEncoding(format); //sets encoding based on options

    if (limitRemoved) {
      //removes time limit
      mediaRecorder.setOptions({ timeLimit: 10800 });
    } else {
      mediaRecorder.setOptions({ timeLimit: timeLimit / 1000 });
    }
    if (format === "mp3") {
      mediaRecorder.setOptions({ mp3: { bitRate: quality } });
    }
    mediaRecorder.startRecording();

    function onStopCommand(command) {
      //keypress
      if (command === "stop") {
        stopCapture();
      }
    }

    function onStopClick(request) {
      //click on popup
      if (request === "stopCapture") {
        stopCapture();
      } else if (request === "cancelCapture") {
        cancelCapture();
      } else if (request.cancelEncodeID) {
        if (request.cancelEncodeID === startTabId && mediaRecorder) {
          mediaRecorder.cancelEncoding();
        }
      }
    }

    chrome.commands.onCommand.addListener(onStopCommand);
    chrome.runtime.onMessage.addListener(onStopClick);

    mediaRecorder.onComplete = (recorder, blob) => {
      audioURL = window.URL.createObjectURL(blob);
      if (completeTabID) {
        chrome.tabs.sendMessage(completeTabID, {
          type: "encodingComplete",
          audioURL,
        });
      }
      mediaRecorder = null;
    };

    mediaRecorder.onEncodingProgress = (recorder, progress) => {
      if (completeTabID) {
        chrome.tabs.sendMessage(completeTabID, {
          type: "encodingProgress",
          progress: progress,
        });
      }
    };

    const stopCapture = function () {
      let endTabId;
      //check to make sure the current tab is the tab being captured
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        endTabId = tabs[0].id;
        if (mediaRecorder && startTabId === endTabId) {
          mediaRecorder.finishRecording();
          chrome.tabs.create({ url: "complete.html" }, (tab) => {
            completeTabID = tab.id;
            let completeCallback = () => {
              chrome.tabs.sendMessage(tab.id, {
                type: "createTab",
                format: format,
                audioURL,
                startID: startTabId,
              });
            };
            setTimeout(completeCallback, 500);
          });
          closeStream(endTabId);
        }
      });
    };

    const cancelCapture = function () {
      let endTabId;
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        endTabId = tabs[0].id;
        if (mediaRecorder && startTabId === endTabId) {
          mediaRecorder.cancelRecording();
          closeStream(endTabId);
        }
      });
    };

    //removes the audio context and closes recorder to save memory
    const closeStream = function (endTabId) {
      chrome.commands.onCommand.removeListener(onStopCommand);
      chrome.runtime.onMessage.removeListener(onStopClick);
      mediaRecorder.onTimeout = () => {};
      audioCtx.close();
      liveStream.getAudioTracks()[0].stop();
      sessionStorage.removeItem(endTabId);
      chrome.runtime.sendMessage({ captureStopped: endTabId });
    };

    mediaRecorder.onTimeout = stopCapture;

    if (!muteTab) {
      let audio = new Audio();
      audio.srcObject = liveStream;
      audio.play();
    }
  });
};

class Recorder {
  constructor(source, configs) {
    //creates audio context from the source and connects it to the worker
    extend(this, CONFIGS, configs || {});
    this.context = source.context;
    if (this.context.createScriptProcessor == null)
      this.context.createScriptProcessor = this.context.createJavaScriptNode;
    this.input = this.context.createGain();
    source.connect(this.input);
    this.buffer = [];
    this.initWorker();
  }

  isRecording() {
    return this.processor != null;
  }

  setEncoding(encoding) {
    if (!this.isRecording() && this.encoding !== encoding) {
      this.encoding = encoding;
      this.initWorker();
    }
  }

  setOptions(options) {
    if (!this.isRecording()) {
      extend(this.options, options);
      this.worker.postMessage({ command: "options", options: this.options });
    }
  }

  startRecording() {
    if (!this.isRecording()) {
      let numChannels = this.numChannels;
      let buffer = this.buffer;
      let worker = this.worker;
      this.processor = this.context.createScriptProcessor(
        this.options.bufferSize,
        this.numChannels,
        this.numChannels
      );
      this.input.connect(this.processor);
      this.processor.connect(this.context.destination);
      this.processor.onaudioprocess = function (event) {
        for (var ch = 0; ch < numChannels; ++ch)
          buffer[ch] = event.inputBuffer.getChannelData(ch);
        worker.postMessage({ command: "record", buffer: buffer });
      };
      this.worker.postMessage({
        command: "start",
        bufferSize: this.processor.bufferSize,
      });
      this.startTime = Date.now();
    }
  }

  cancelRecording() {
    if (this.isRecording()) {
      this.input.disconnect();
      this.processor.disconnect();
      delete this.processor;
      this.worker.postMessage({ command: "cancel" });
    }
  }

  finishRecording() {
    if (this.isRecording()) {
      this.input.disconnect();
      this.processor.disconnect();
      delete this.processor;
      this.worker.postMessage({ command: "finish" });
    }
  }

  cancelEncoding() {
    if (this.options.encodeAfterRecord)
      if (!this.isRecording()) {
        this.onEncodingCanceled(this);
        this.initWorker();
      }
  }

  initWorker() {
    if (this.worker != null) this.worker.terminate();
    this.onEncoderLoading(this, this.encoding);
    this.worker = new Worker(this.workerDir + WORKER_FILE[this.encoding]);
    let _this = this;
    this.worker.onmessage = function (event) {
      let data = event.data;
      switch (data.command) {
        case "loaded":
          _this.onEncoderLoaded(_this, _this.encoding);
          break;
        case "timeout":
          _this.onTimeout(_this);
          break;
        case "progress":
          _this.onEncodingProgress(_this, data.progress);
          break;
        case "complete":
          _this.onComplete(_this, data.blob);
      }
    };
    this.worker.postMessage({
      command: "init",
      config: {
        sampleRate: this.context.sampleRate,
        numChannels: this.numChannels,
      },
      options: this.options,
    });
  }

  onEncoderLoading(recorder, encoding) {}
  onEncoderLoaded(recorder, encoding) {}
  onTimeout(recorder) {}
  onEncodingProgress(recorder, progress) {}
  onEncodingCanceled(recorder) {}
  onComplete(recorder, blob) {}
}
