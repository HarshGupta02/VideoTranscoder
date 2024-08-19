const {S3Client, GetObjectCommand, PutObjectCommand} = require('@aws-sdk/client-s3');
const fs = require("node:fs/promises");
const path = require("node:path");
const ffmpeg = require('fluent-ffmpeg');
const fsOld = require('fs');

const INPUT_BUCKET_NAME = process.env.INPUT_BUCKET_NAME;
const KEY = process.env.KEY;
const awsRegion = process.env.AWS_REGION;
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const OUTPUT_BUCKET_NAME = process.env.OUTPUT_BUCKET_NAME;

const RESOLUTIONS = [
    {name: "144p", width: 256, height: 144, bandwidth: 100000},
    {name: "240p", width: 426, height: 240, bandwidth: 300000},  
    {name: "360p", width: 480, height: 360, bandwidth: 800000},
    {name: "480p", width: 858, height: 480, bandwidth: 1400000},
    {name: "720p", width: 1280, height: 720, bandwidth: 2800000},
    {name: "1080p", width: 1920, height: 1080, bandwidth: 5000000},
    {name: "1440p", width: 2560, height: 1440, bandwidth: 8000000},
    // {name: "2160p", width: 3840, height: 2160, bandwidth: 16000000} requires Higher compute and storage (Vertical Scaling)
];



const s3Client = new S3Client({
    region: awsRegion,
    credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey
    }
});

async function init() {
    const command = new GetObjectCommand({
        Bucket: INPUT_BUCKET_NAME,
        Key: KEY
    });
    const result = await s3Client.send(command);
    const originalFilePath = 'original-video.mp4';
    await fs.writeFile(originalFilePath, result.Body);
    const originalVideoPath = path.resolve(originalFilePath);

    const masterPlaylist = ['#EXTM3U'];

    const promises = RESOLUTIONS.map((resolution) => {
        const outputPath = path.resolve(`Outputs/${resolution.name}`);
        const hlsPath = `${outputPath}/index.m3u8`;

        return new Promise((resolve, reject) => {
            ffmpeg(originalVideoPath)
                .videoCodec('libx264')
                .audioCodec('aac')
                .outputOptions([
                    '-hls_time 10',
                    '-hls_playlist_type vod',
                    `-hls_segment_filename ${outputPath}/segment%03d.ts`,
                    '-start_number 0',
                    `-vf scale=w=${resolution.width}:h=${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:-1:-1:color=black`
                ])
                .output(hlsPath)
                .on('end', async() => {
                    try {
                        const playListCommand = new PutObjectCommand({
                            Bucket: OUTPUT_BUCKET_NAME,
                            Key: `${resolution.name}/index.m3u8`,
                            Body: fsOld.createReadStream(path.resolve(hlsPath))
                        });
                        await s3Client.send(playListCommand);
                        console.log(`Uploaded playlist to ${resolution.name}/index.m3u8`);

                        const segments = await fs.readdir(outputPath);
                        const uploadPromises = segments.map(async (segment) => {
                            if(path.extname(segment) === '.ts') {
                                const segmentCommand = new PutObjectCommand({
                                    Bucket: OUTPUT_BUCKET_NAME,
                                    Key: `${resolution.name}/${segment}`,
                                    Body: fsOld.createReadStream(path.join(outputPath, segment))
                                });
                                await s3Client.send(segmentCommand);
                                console.log(`Uploaded segment to ${resolution.name}/${segment}`);
                            }
                        });
                        await Promise.all(uploadPromises);

                        masterPlaylist.push(`#EXT-X-STREAM-INF:BANDWIDTH=${resolution.bandwidth},RESOLUTION=${resolution.width}x${resolution.height}`);
                        masterPlaylist.push(`${resolution.name}/index.m3u8`);

                        resolve(`${resolution.name}/index.m3u8`);

                    } catch (error) {
                        console.log(error);
                        reject(error);
                    }
                })
                .on('error', (err) => {
                    reject(err);
                })
                .format('hls')
                .run();
        });
    });
    await Promise.all(promises);

    const masterPlaylistContent = masterPlaylist.join('\n');
    const masterPlaylistCommand = new PutObjectCommand({
        Bucket: OUTPUT_BUCKET_NAME,
        Key: 'master.m3u8',
        Body: masterPlaylistContent
    });
    await s3Client.send(masterPlaylistCommand);

    console.log('Master playlist uploaded successfully.');
    console.log('All resolutions processed and uploaded successfully.');
}

init().catch((error) => {
    console.error('Error processing video:', error);
});