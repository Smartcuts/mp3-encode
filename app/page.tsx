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

function formatTimeMillis(timeMillis: number) {
    if (timeMillis < 1000) {
        return `${timeMillis}ms`;
    } else if (timeMillis < 60 * 1000) {
        let seconds = Math.floor(timeMillis / 1000);
        let millis = timeMillis % 1000;
        return `${seconds}.${String(millis).padStart(3, "0")}ms`;
    } else {
        let minutes = Math.floor(timeMillis / (60 * 1000));
        let seconds = Math.floor((timeMillis % (60 * 1000)) / 1000);
        let millis = timeMillis % 1000;
        return `${minutes}m${seconds}.${String(millis).padStart(3, "0")}s`;
    }

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
        <main className="max-w-prose m-auto my-20 p-6 space-y-5">
            <div className="border border-gray p-4">
                <label>Current audio sample length: </label>
                <div className="flex flex-row space-x-5">
                    <input
                        className="grow"
                        type="range"
                        min="1" max="6"
                        onChange={event => {
                            let target = event.target as HTMLInputElement;
                            let value = target.value;
                            setAudioLengthMins(_ => audioLengthMinsLookupTable[value]!);
                        }}
                        defaultValue={defaultAudioLengthKey}
                    />
                    <span>
                        {audioLengthMins} minutes
                    </span>
                </div>
            </div>
            <div className="flex flex-col space-y-2">
                <button
                    className="p-2 text-sm rounded border bg-blue-600 text-white disabled:opacity-50"
                    disabled={!maybeAudioBuffer || isEncoding}
                    onClick={_event => {
                        let t1 = Date.now();
                        setIsEncoding(_ => true);
                        let _: Promise<void> = (async () => {
                            let audioBuffer = maybeAudioBuffer!;
                            let mp3 = await mp3encode(audioBuffer, 64 /* kbps */);
                            let t2 = Date.now();
                            let timeMillis = t2 - t1;
                            let blob = new Blob([mp3], { type: "audio/mpeg" });
                            let objectUrl = URL.createObjectURL(blob);
                            setIsEncoding(_ => false);
                            setLogs(logs => logs.concat([{ audioLengthMins, timeMillis, objectUrl }]));
                        })();
                    }}
                >{!maybeAudioBuffer ?
                    "Loading source buffer..." :
                    isEncoding ?
                        "Encoding..." :
                        "Encode"}
                </button>
            </div>
            <div className="text-gray-600 space-y-1">
                <h2>Encoding history</h2>
                <table className="w-full border-separate border-spacing-2 border border-gray p-4">
                    <tbody>
                        {logs.length > 0 &&
                            logs.map((log, index) =>
                                <tr key={index}>
                                    <td>#{index + 1}</td>
                                    <td>Encoded audio of <i>{log.audioLengthMins} minutes</i> in </td>
                                    <td><i className="text-gray-900">{formatTimeMillis(log.timeMillis)}</i></td>
                                    <td>
                                        <button
                                            className="border text-sm p-1"
                                            onClick={_event => {
                                                let downloadLink = document.createElement("a");
                                                downloadLink.setAttribute("href", log.objectUrl);
                                                downloadLink.setAttribute("download", "test.mp3");
                                                document.body.appendChild(downloadLink);
                                                downloadLink.click();
                                                document.body.removeChild(downloadLink);
                                            }}>Download</button>
                                    </td>
                                </tr>
                            ) ||
                            <tr><td>You haven't encoded anything yet. Click on the "Encode" button to start.</td></tr>
                            }
                    </tbody>
                </table>
            </div>
        </main >
    )
}