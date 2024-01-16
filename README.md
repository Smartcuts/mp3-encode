Improve in-browser mp3 encoding efficiency
=====

A bit of background here: We are working on a project that involves exporting audio. Currently the export to mp3 is quite slow, as it takes ~5 minutes to encode a 40-minutes long audio. Here's a summary of time spent encoding mp3 files using the _current method_:

![Benchmark 2024-01-16](/docs/benchmark_2024-01-16.png)

The result might vary based on CPU usage and what machine you are using, so I would suggest run the test with the current method and take a screenshot for future comparison.

Your task is to help us improve the mp3 exporting procedure, to make it faster. Ideally we want to be able to encode in a similar efficiency as the FFMPEG program, to encode a 10-minutes audio in <= 25 seconds.

We have put together a playground (this project) for you so that you can focus on improving the encoding method. For more instruction on how to get started, see the [Running the playground locally](#running-the-playground-locally) section. Here's a quicker version: `npm i && npm run dev`

![Playground](/docs/playground_1.png)

On the playground, you can test out your encoding method by clicking on the "Encode" method. After the encoding is done, you will see a history entry in the "Encoding history" section, so that you can know how long did it take, and download the mp3 file to verify that the audio file is correct.

The audio length slider is for you to adjust the length of the audio to be encoded while testing, so that you don't spend too long waiting for a preliminary result. There are a few stops to choose from - 1 minute, 2 minutes, 5 minutes, 10minutes, 25 minutes and 40 minutes, which covers the range of length of audios we need exporting. When you are done with improving the encoding method, please make sure that you run tests against all stops, like below.

![Results](/docs/playground_2.png)

The file you need to modify is [`src/mp3encode.js`](src/mp3encode.js), whose only export is the mp3 encoding function. You are free to swap the `lamejstmp` with any NPM packages, as long as you can make them running in browser envinronment.

Currently, we are testing with a fixed encoding rate at 64kbps, mono channel, as this provides good balance of quality and file size. For a 1-minute long audio, the encoded mp3 file is 480KB. Any equivalent VBR configuration is also acceptable.


## Running the playground locally

Prerequisites:
- Node.js >= 18 (18.x or 20.x is preferred)
- Git

Fork the repository
```
git clone https://github.com/Smartcuts/mp3-encode.git
cd mp3-encode
```

Install deps
```
npm install
```

Start the server
```
npm run dev
```

And go to `http://localhost:3000` (the port might change if `:3000` is in use)