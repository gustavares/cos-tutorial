import { S3, Credentials } from 'ibm-cos-sdk';
import dotenv from 'dotenv';
const URL_EXPIRATION_TIME = 60 * 5;

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

export async function getPresignedDownloadUrl(bucket, fileName) {
    const url = await cos.getSignedUrl('getObject', {
        Bucket: bucket,
        Key: fileName,
        Expires: URL_EXPIRATION_TIME,
    });

    return url;
}