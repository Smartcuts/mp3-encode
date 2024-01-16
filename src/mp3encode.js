import { Mp3Encoder } from "lamejstmp";

export default async function (audioBuffer, kbps) {
    const mp3encoder = new Mp3Encoder(audioBuffer.numberOfChannels, audioBuffer.sampleRate, kbps);

    let channels = [];
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        let channelData = audioBuffer.getChannelData(i);
        let samples = new Int16Array(channelData.length);
        for (let j = 0; j < channelData.length; j++) {
            samples[j] = channelData[j] * 32767; // Convert float samples to 16-bit signed integer
        }
        channels[i] = samples;
    }

    let encoded = mp3encoder.encodeBuffer(...channels);

    let mp3 = [];
    mp3.push(encoded);
    let end = mp3encoder.flush();
    if (end.length > 0) {
        mp3.push(end);
    }

    // Concatenate Uint8Array objects into a single ArrayBuffer
    let totalLength = mp3.reduce((total, arr) => total + arr.length, 0);
    let result = new Uint8Array(totalLength);
    let offset = 0;
    for (let arr of mp3) {
        result.set(arr, offset);
        offset += arr.length;
    }

    return result.buffer;
}
