"use client";
import { useState, useEffect, useMemo } from 'react';
import mp3encode from "../src/mp3encode";

const audioLengthMinsLookupTable = {
    "1": 1,
    "2": 2,
    "3": 5,
    "4": 10,
    "5": 25,
    "6": 40,
}

type log = {
    audioLengthMins: number,
    timeMillis: number,
    objectUrl: string,
}

export default function app() {
    let defaultAudioLengthKey = "4";
    let [audioLengthMins, setAudioLengthMins] = useState(() =>
        audioLengthMinsLookupTable[defaultAudioLengthKey]!
    );

    let sampleRate = 44100; // 44.1kHz
    let [maybeSourceBuffer, setMaybeSourceBuffer] = useState(() =>
        undefined as AudioBuffer | undefined
    );
    useEffect(() => {
        let _: Promise<void> = (async () => {
            let decoder = new OfflineAudioContext({
                numberOfChannels: 1,
                length: sampleRate * 60, // 60 seconds
                sampleRate: sampleRate,
            });
            let response = await fetch(
                "/sample.mp3",
                {
                    method: "GET",
                    mode: "cors",
                    cache: "force-cache",
                },
            );
            let blob = await response.blob();
            let arrayBuffer = await blob.arrayBuffer();
            let audioBuffer = await decoder.decodeAudioData(arrayBuffer);
            setMaybeSourceBuffer(_ => audioBuffer);
        })()
    }, []);

    let [maybeAudioBuffer, setMaybeAudioBuffer] = useState(() => undefined as AudioBuffer | undefined);
    useEffect(() => {
        setMaybeAudioBuffer(_ => undefined);
        if (!!maybeSourceBuffer) {
            let _: Promise<void> = (async () => {
                let audioLengthSeconds = 60 * audioLengthMins;
                let numberOfChannels = 1;
                let renderer = new OfflineAudioContext({
                    numberOfChannels,
                    sampleRate,
                    length: sampleRate * numberOfChannels * audioLengthSeconds,
                });
                let destination = renderer.destination;
                for (let i = 0; i < audioLengthMins; i++) {
                    let source = renderer.createBufferSource();
                    source.buffer = maybeSourceBuffer!;
                    source.connect(destination);
                    source.start(i * 60);
                }
                let audioBuffer = await renderer.startRendering();
                setMaybeAudioBuffer(_ => audioBuffer);
            })();
        }
    }, [maybeSourceBuffer, audioLengthMins])

    let [isEncoding, setIsEncoding] = useState(() => false);
    let [logs, setLogs] = useState(() => [] as log[]);

    return (
        <>
            <div>
                <input
                    type="range"
                    min="1" max="6"
                    onChange={event => {
                        let target = event.target as HTMLInputElement;
                        let value = target.value;
                        setAudioLengthMins(_ => audioLengthMinsLookupTable[value]!);
                    }}
                    defaultValue={defaultAudioLengthKey}
                />
                <span>Current audio sample size: </span>
                {audioLengthMins}
                <span> minutes</span>
            </div>
            {
                maybeAudioBuffer &&
                <button
                    disabled={isEncoding}
                    onClick={_event => {
                        let t1 = Date.now();
                        setIsEncoding(_ => true);
                        let _: Promise<void> = (async () => {
                            let audioBuffer = maybeAudioBuffer!;
                            let mp3 = await mp3encode(audioBuffer, 64 /* kBps */);
                            let t2 = Date.now();
                            let timeMillis = t2 - t1;
                            let blob = new Blob([mp3], { type: "audio/mpeg" });
                            let objectUrl = URL.createObjectURL(blob);
                            setIsEncoding(_ => false);
                            setLogs(logs => logs.concat([{ audioLengthMins, timeMillis, objectUrl }]));
                        })();
                    }}
                >
                    {isEncoding ? "Encoding..." : "Encode"}
                </button>
            }
            <div>
                <ol>
                    {logs.map((log, index) =>
                        <li key={index}>
                            <span>Encoded audio of {log.audioLengthMins} minutes in {log.timeMillis}ms</span>
                            <button onClick={_event => {
                                let downloadLink = document.createElement("a");
                                downloadLink.setAttribute("href", log.objectUrl);
                                downloadLink.setAttribute("download", "test.mp3");
                                document.body.appendChild(downloadLink);
                                downloadLink.click();
                                document.body.removeChild(downloadLink);
                            }}>Download</button>
                        </li>
                    )}</ol>
            </div>
        </>)
}