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
    console.log(originalVideoPath);

    const promises = RESOLUTIONS.map((resolution) => {
        const uniqueId = v4();
        const outputVideoPath = `${uniqueId}_${resolution.name}.mp4`;
        return new Promise((resolve) => {
            ffmpeg(originalVideoPath)
            .output(outputVideoPath)
            .withVideoCodec("libx264")
            .withAudioCodec("aac")
            .withSize(`${resolution.width}x${resolution.height}`)
            .on("end", async () => {
                const putCommand = new PutObjectCommand({   
                    Bucket: OUTPUT_BUCKET_NAME, 
                    Key: outputVideoPath,
                    Body: fsOld.createReadStream(path.resolve(outputVideoPath))
                });
                await s3Client.send(putCommand);
                console.log(`Uploaded ${outputVideoPath}`)
                resolve(outputVideoPath);
            })
            .format('mp4')
            .run();
        })
    });
    await Promise.all(promises);
}

init();