import { Router } from 'express';
import { 
    getPresignedUrl, 
    listFilesFromBucket, 
    getPresignedUploadUrlParts,
    completeMultipartUpload,
    abortMultipartUpload 
} from './cos';

const router = Router();

router.get('/:bucketName/files', async (req, res, next) => {
    const { bucketName } = req.params;

    try {
        const fileList = await listFilesFromBucket(bucketName);

        res.status(200).json({ files: fileList });
    } catch (e) {
        next(e);
    }
}); 

router.get('/:bucketName/files/:key/presigned/upload/multipart', async (req, res, next) => {
    const { bucketName, key } = req.params;
    const { parts } = req.query;

    try {
        const uploadIdAndParts = await getPresignedUploadUrlParts(bucketName, key, parts);

        return res.status(200).json(uploadIdAndParts);
    } catch (e) {
        next(e);
    }
});

router.post('/:bucketName/files/:key/presigned/upload/multipart', async (req, res, next) => {
    const { bucketName, key } = req.params;
    const { uploadId, partsEtags } = req.body;

    try {
        await completeMultipartUpload(bucketName, key, uploadId, partsEtags);

        return res.status(200).json(`Multipart upload for ${key} completed successfully.`);
    } catch (e) {
        next(e);
    }
});

router.delete('/:bucketName/files/:key/presigned/upload/multipart', async (req, res, next) => {
    const { bucketName, key } = req.params;
    const { uploadId } = req.query;

    try {
        await abortMultipartUpload(bucketName, key, uploadId);

        return res.status(200).json(`Multipart upload for ${key} aborted successfully.`);
    } catch (e) {
        next(e);
    }
});

router.get('/:bucketName/files/:key/presigned/upload', (req, res, next) => {
    res.locals.operation = 'putObject';
    
    next();
}, presignedController);

router.get('/:bucketName/files/:key/presigned/download', (req, res, next) => {  
    res.locals.operation = 'getObject';
    
    next();
}, presignedController);

async function presignedController(req, res, next) {
    const { bucketName, key } = req.params;
    const { operation } = res.locals;

    try {
        const url = await getPresignedUrl(bucketName, key, operation);

        return res.status(200).json({ url });
    } catch(e) {
        next(e);
    }
}

export const bucketRoutes = router;