const express = require('express');
const cors = require('cors');
const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');

const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = 5000;

const awsRegion = process.env.AWS_REGION;
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const awsInputBucketName = process.env.AWS_INPUT_BUCKET_NAME;

const s3Client = new S3Client({
    region: awsRegion,
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
});

app.use(cors());
app.use(express.json());

app.get('/test', (req, res) => {
    return res.json({'msg': 'Hello'});
});

app.post('/api/upload', async (req, res) => {
    try{
        const {fileName, contentType} = req.body;
        if(!fileName || !contentType) {
            return res.status(400).json({ error: 'FileName or ContentType are required' });
        }
        const command = new PutObjectCommand({
            Bucket: awsInputBucketName,
            Key: fileName,
            ContentType: contentType
        });
        const url = await getSignedUrl(s3Client, command, {expiresIn : 3600});
        console.log(url);
        return res.json({'PresignedURL': url});
    }catch(error){
        console.error('Error generating presigned URL:', error);
        return res.status(500).json({ error: 'Failed to generate presigned URL' });
    }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
