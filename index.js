const videoPath = '/root/projects/github/moviestreamer/videores/main/movie.mkv'


const express = require('express');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const app = express();
const port = 3000;

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/video', (req, res) => {
    const range = req.headers.range;

    if (!range) {
        return res.status(400).send('Requires Range header');
    }

    const videoSize = fs.statSync(videoPath).size;
    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ''));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    const contentLength = end - start + 1;

    const headers = {
        'Content-Range': `bytes ${start}-${end}/${videoSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': contentLength,
        'Content-Type': 'video/mp4',
    };

    res.writeHead(206, headers);

    const stream = ffmpeg(videoPath)
        .format('mp4')
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
            `-ss ${start / videoSize}`,
            `-t ${contentLength / videoSize}`
        ])
        .pipe(res, { end: true });

    stream.on('error', (err) => {
        console.error(err);
        res.status(500).send('Error processing video stream');
    });
});

app.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
});
