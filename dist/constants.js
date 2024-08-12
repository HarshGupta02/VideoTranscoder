"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.awsOutputBucketName = exports.awsEcsContainer = exports.awsVpcSubnet = exports.awsSecurityGroup = exports.awsClusterUrl = exports.awsTaskDefinitionUrl = exports.awsQueueUrl = exports.awsSecretAccessKey = exports.awsAccessKeyId = exports.awsRegion = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
exports.awsRegion = process.env.AWS_REGION;
exports.awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
exports.awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
exports.awsQueueUrl = process.env.AWS_QUEUE_URL;
exports.awsTaskDefinitionUrl = process.env.AWS_TASK_DEFINITION_URL;
exports.awsClusterUrl = process.env.AWS_CLUSTER_URL;
exports.awsSecurityGroup = process.env.AWS_SECURITY_GROUPS;
exports.awsVpcSubnet = process.env.AWS_VPC_SUBNETS;
exports.awsEcsContainer = process.env.AWS_ECS_CONTAINER;
exports.awsOutputBucketName = process.env.AWS_OUTPUT_BUCKET_NAME;
