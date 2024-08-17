import * as dotenv from 'dotenv'
dotenv.config();

export const awsRegion: string = process.env.AWS_REGION as string;
export const awsAccessKeyId: string = process.env.AWS_ACCESS_KEY_ID as string;
export const awsSecretAccessKey: string = process.env.AWS_SECRET_ACCESS_KEY as string;
export const awsQueueUrl: string = process.env.AWS_QUEUE_URL as string;
export const awsTaskDefinitionUrl: string = process.env.AWS_TASK_DEFINITION_URL as string;
export const awsClusterUrl: string = process.env.AWS_CLUSTER_URL as string;
export const awsSecurityGroup: string = process.env.AWS_SECURITY_GROUPS as string;
export const awsVpcSubnet: string = process.env.AWS_VPC_SUBNETS as string;
export const awsEcsContainer: string = process.env.AWS_ECS_CONTAINER as string;
export const awsInputBucketName: string = process.env.AWS_INPUT_BUCKET_NAME as string;
export const awsOutputBucketName: string = process.env.AWS_OUTPUT_BUCKET_NAME as string;