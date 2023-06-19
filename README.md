# Meeper 📝

Meeper is an open-source browser extension that serves as your secretary for any in-browser conference. It leverages the power of ChatGPT and Whisper AI to provide transcriptions, summaries, and more for meetings and any browser tab.

![meeper_hehe](hehe.png)

## Features

- Works seamlessly with your OpenAI account.

- Your API Key is securely stored locally on your browser, encrypted, and never transmitted elsewhere.

- Meeper utilizes Whisper for accurate transcriptions and ChatGPT for generating summaries.

- Speech detection feature optimizes API usage by activating only when speech sounds are detected, reducing up to 30% of resource consumption.

- Utilizes the chrome tabCapture API to capture audio from specific tabs.

- Multiple launch options available: hotkey activation, extension popup, and context menu integration.

- Real-time control of transcription playback, similar to a music player.

- Supports running transcriptions simultaneously from multiple tabs.

- Multilingual support for diverse language requirements.

- History is stored directly on the user's local machine for easy access.

## Usage

To get started, follow these steps:

1. Install Meeper from the Chrome Web Store or your browser's extension marketplace.

2. Upon installation, enter your OpenAI API Key in the extension settings. Rest assured, the key is securely stored on your local machine and never shared externally.

3. Launch Meeper using one of the following methods:
  - Press the configured hotkey combination.
  - Click on the Meeper icon in the browser toolbar and select "Launch Meeper."
  - Right-click on a tab and choose the "Launch Meeper" option from the context menu.

4. Once Meeper is activated, it will start transcribing the audio from the currently selected tab. You can control the playback, pause, or skip to specific sections of the transcription in real-time.

5. Enjoy the convenience of having accurate transcriptions and summaries for your in-browser conferences!

## Build

> Requires: [`Node.js ^14`](https://nodejs.org).

1. Get the source code

```bash
git clone git@github.com:pas1ko/meeper.git && cd meeper
```

2. Install app dependencies

```bash
npm install
```

3. Build an application

```bash
npm run build
```

4. Add an application to the browser locally

  - Open `chrome://extensions/` in your browser
  - Enable "Developer mode"
  - Tap on "Load unpacked"
  - Select `<your_local_meeper_repository_dir>/ext`

## Contributing

We welcome contributions to enhance the functionality and usability of Meeper. To contribute, please follow these guidelines:

1. Fork the repository and clone it locally.

2. Create a new branch for your feature or bug fix.

3. Implement your changes and ensure that the code follows the project's coding conventions.

4. Writing tests is always welcome:)

5. Commit your changes and push the branch to your forked repository.

5. Open a pull request, describing the changes you've made and their purpose.

## License

Meeper is released under the [Mozilla Public License (MPL)](LICENSE).
