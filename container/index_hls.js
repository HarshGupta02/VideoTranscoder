const {S3Client, GetObjectCommand, PutObjectCommand} = require('@aws-sdk/client-s3');
const fs = require("node:fs/promises");
const path = require("node:path");
const ffmpeg = require('fluent-ffmpeg');
const fsOld = require('fs');
const {v4} = require('uuid');

const INPUT_BUCKET_NAME = process.env.INPUT_BUCKET_NAME;
const KEY = process.env.KEY;
const awsRegion = process.env.AWS_REGION;
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const OUTPUT_BUCKET_NAME = process.env.OUTPUT_BUCKET_NAME;

const RESOLUTIONS = [
    {name: "360p", width: 480, height: 360},
    {name: "480p", width: 858, height: 480},
    {name: "720p", width: 1280, height: 720},  
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
    console.log('All resolutions processed and uploaded successfully.');
}

init().catch((error) => {
    console.error('Error processing video:', error);
});