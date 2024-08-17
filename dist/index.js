"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_sqs_1 = require("@aws-sdk/client-sqs");
const client_ecs_1 = require("@aws-sdk/client-ecs");
const constants_1 = require("./constants");
const awsClientCredentials = {
    region: constants_1.awsRegion,
    credentials: {
        accessKeyId: constants_1.awsAccessKeyId,
        secretAccessKey: constants_1.awsSecretAccessKey
    }
};
const sqsClient = new client_sqs_1.SQSClient(awsClientCredentials);
const ecsClient = new client_ecs_1.ECSClient(awsClientCredentials);
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        const command = new client_sqs_1.ReceiveMessageCommand({
            QueueUrl: constants_1.awsQueueUrl,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 20
        });
        while (true) {
            const { Messages } = yield sqsClient.send(command);
            if (!Messages) {
                console.log('No Messages Found in Queue');
                continue;
            }
            try {
                for (const message of Messages) {
                    const { MessageId, Body } = message;
                    const messageInfo = {
                        QueueUrl: constants_1.awsQueueUrl,
                        ReceiptHandle: message.ReceiptHandle
                    };
                    console.log(`Message Received`, { MessageId, Body });
                    if (!Body)
                        continue;
                    const event = JSON.parse(Body);
                    if ("Services" in event && "Event" in event) {
                        if (event.Event === "s3:TestEvent") {
                            yield sqsClient.send(new client_sqs_1.DeleteMessageCommand(messageInfo));
                            continue;
                        }
                    }
                    // throw new Error("Processing Failed");
                    // Goes to catch block that puts the message eventually to Dead Letter Queue we attached with this Source Queue
                    // Maximum Receives = 2 so try 2 times before adding to DLQ
                    for (const record of event.Records) {
                        const { s3 } = record;
                        const { bucket, object: { key } } = s3;
                        const runTaskCommand = new client_ecs_1.RunTaskCommand({
                            taskDefinition: constants_1.awsTaskDefinitionUrl,
                            cluster: constants_1.awsClusterUrl,
                            launchType: 'FARGATE',
                            networkConfiguration: {
                                awsvpcConfiguration: {
                                    assignPublicIp: 'ENABLED',
                                    securityGroups: [constants_1.awsSecurityGroup],
                                    subnets: [constants_1.awsVpcSubnet],
                                }
                            },
                            overrides: {
                                containerOverrides: [
                                    {
                                        name: constants_1.awsEcsContainer,
                                        environment: [
                                            { name: 'INPUT_BUCKET_NAME', value: bucket.name },
                                            { name: 'KEY', value: key },
                                            { name: 'AWS_REGION', value: constants_1.awsRegion },
                                            { name: 'AWS_ACCESS_KEY_ID', value: constants_1.awsAccessKeyId },
                                            { name: 'AWS_SECRET_ACCESS_KEY', value: constants_1.awsSecretAccessKey },
                                            { name: 'OUTPUT_BUCKET_NAME', value: constants_1.awsOutputBucketName }
                                        ]
                                    }
                                ]
                            },
                        });
                        yield ecsClient.send(runTaskCommand);
                        yield sqsClient.send(new client_sqs_1.DeleteMessageCommand(messageInfo));
                    }
                }
            }
            catch (error) {
                console.log(error);
            }
        }
    });
}
init();
