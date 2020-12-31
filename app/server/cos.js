import { S3, Credentials } from 'ibm-cos-sdk';
import dotenv from 'dotenv';

dotenv.config();

export const cos = new S3({
    endpoint: process.env.COS_ENDPOINT,
    apiKeyId: process.env.COS_APIKEYID,
    ibmAuthEndpoint: process.env.COS_IBM_AUTH_ENDPOINT,
    serviceInstanceId: process.env.COS_RESOURCE_INSTANCE_ID,
    credentials: new Credentials(
        process.env.COS_HMAC_ACCESS_KEY_ID, 
        process.env.COS_HMAC_SECRET_ACCESS_KEY,
        null
    ),
    signatureVersion: 'v4'
});

export async function listFilesFromBucket(bucketName) {
    const result = await cos.listObjects({
        Bucket: bucketName
    }).promise();

    if (result === null || result.Contents === null) {
        return [];
    }

    return result.Contents.map(object => object.Key);
}

export async function getPresignedUrl(bucket, fileName, operation) {
    const url = await cos.getSignedUrl(operation, {
        Bucket: bucket,
        Key: fileName,
    });

    return url;
}