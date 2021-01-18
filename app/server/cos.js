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

/**
 * Initiates a multipart upload and returns the UploadId
 * 
 * @param {string} bucket 
 * @param {string} fileName 
 */
async function initiateMultipartUpload(bucket, fileName) {
    const response = await cos.createMultipartUpload({
        Bucket: bucket,
        Key: fileName
    }).promise();

    return response.UploadId;
}

/**
 * Initiates a multipart upload.
 * 
 * Returns an object with the UploadId and 
 * a list of objects containing signed URLs and the part number related to it 
 * to be used to upload file parts.
 * 
 * @param {string} bucket 
 * @param {string} fileName 
 * @param {number} numberOfParts 
 */
export async function getPresignedUploadUrlParts(bucket, fileName, numOfParts) {
    const numberOfParts = Number(numOfParts);
    const uploadId = await initiateMultipartUpload(bucket, fileName);
    
    const promises = [];
    [...Array(numberOfParts).keys()].map((partNumber) => {
        const promise = cos.getSignedUrlPromise('uploadPart', {
            Bucket: bucket,
            Key: fileName,
            UploadId: uploadId,
            PartNumber: partNumber + 1
        });

        promises.push(promise);
    });

    const urls = await Promise.all(promises);
    
    const parts = urls.map((url, index) => ({
        part: index + 1,
        url: url
    }));

    return { uploadId, parts }
}

export async function completeMultipartUpload(bucket, fileName, uploadId, partsEtags) {
    await cos.completeMultipartUpload({
        Bucket: bucket,
        Key: fileName,
        UploadId: uploadId,
        MultipartUpload: { Parts: partsEtags }
    }).promise();
}

export async function abortMultipartUpload(bucket, fileName, uploadId) {
    await cos.abortMultipartUpload({
        Bucket: bucket, 
        Key: fileName, 
        UploadId: uploadId
    }).promise();
}