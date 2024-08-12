import {ReceiveMessageCommand, SQSClient, DeleteMessageCommand} from '@aws-sdk/client-sqs'
import type { S3Event } from 'aws-lambda';
import {ECSClient, RunTaskCommand} from '@aws-sdk/client-ecs'
import {
        awsRegion, awsAccessKeyId, awsSecretAccessKey, 
        awsQueueUrl, awsClusterUrl, awsEcsContainer, 
        awsSecurityGroup, awsTaskDefinitionUrl, awsVpcSubnet, awsOutputBucketName
        } 
from './constants';

const awsClientCredentials = {
    region: awsRegion,
    credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey
    }
}

const sqsClient = new SQSClient(awsClientCredentials); 
const ecsClient = new ECSClient(awsClientCredentials);

async function init() {

    const command = new ReceiveMessageCommand({
        QueueUrl: awsQueueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20
    });

    while(true) {
        const {Messages} = await sqsClient.send(command);
        if(!Messages) {
            console.log('No Messages Found in Queue');
            continue;
        }
        try {
            for(const message of Messages) {

                const {MessageId, Body} = message;
                const messageInfo = {
                    QueueUrl: awsQueueUrl,
                    ReceiptHandle: message.ReceiptHandle
                };

                console.log(`Message Received`, {MessageId, Body});
                if(!Body) continue;

                const event = JSON.parse(Body) as S3Event;
                if ("Services" in event && "Event" in event) {
                    if (event.Event === "s3:TestEvent") {
                        await sqsClient.send(new DeleteMessageCommand(messageInfo));
                        continue;
                    }
                }

                for(const record of event.Records) {
                    const {s3} = record;
                    const {bucket, object : {key}} = s3;
                    const runTaskCommand = new RunTaskCommand({
                        taskDefinition: awsTaskDefinitionUrl,
                        cluster: awsClusterUrl,
                        launchType: 'FARGATE',
                        networkConfiguration: {
                            awsvpcConfiguration: {
                                assignPublicIp: 'ENABLED',
                                securityGroups: [awsSecurityGroup],
                                subnets: [awsVpcSubnet],
                            }
                        },
                        overrides: {
                            containerOverrides: [
                                {
                                    name: awsEcsContainer, 
                                    environment: [
                                        {name: 'INPUT_BUCKET_NAME', value: bucket.name},
                                        {name: 'KEY', value: key},
                                        {name: 'AWS_REGION', value: awsRegion},
                                        {name: 'AWS_ACCESS_KEY_ID', value: awsAccessKeyId},
                                        {name: 'AWS_SECRET_ACCESS_KEY', value: awsSecretAccessKey},
                                        {name: 'OUTPUT_BUCKET_NAME', value: awsOutputBucketName}       
                                    ]
                                }
                            ]
                        },
                    });

                    await ecsClient.send(runTaskCommand);
                    await sqsClient.send(new DeleteMessageCommand(messageInfo));

                }
            }
        } catch (error) {
            console.log(error);
        }

    }
}

init();