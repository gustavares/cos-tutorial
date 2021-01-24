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

router.get('/:bucketName/files/:fileName/presigned/upload/multipart', async (req, res, next) => {
    const { bucketName, fileName } = req.params;
    const { parts } = req.query;

    try {
        const uploadIdAndParts = await getPresignedUploadUrlParts(bucketName, fileName, parts);

        return res.status(200).json(uploadIdAndParts);
    } catch (e) {
        next(e);
    }
});

router.post('/:bucketName/files/:fileName/presigned/upload/multipart', async (req, res, next) => {
    const { bucketName, fileName } = req.params;
    const { uploadId, partsETags } = req.body;

    try {
        await completeMultipartUpload(bucketName, fileName, uploadId, partsETags);

        return res.status(200).json(`Multipart upload for ${fileName} completed successfully.`);
    } catch (e) {
        next(e);
    }
});

router.delete('/:bucketName/files/:fileName/presigned/upload/multipart', async (req, res, next) => {
    const { bucketName, fileName } = req.params;
    const { uploadId } = req.query;

    try {
        await abortMultipartUpload(bucketName, fileName, uploadId);

        return res.status(200).json(`Multipart upload for ${fileName} aborted successfully.`);
    } catch (e) {
        next(e);
    }
});

router.get('/:bucketName/files/:fileName/presigned/upload', (req, res, next) => {
    res.locals.operation = 'putObject';
    
    next();
}, presignedController);

router.get('/:bucketName/files/:fileName/presigned/download', (req, res, next) => {  
    res.locals.operation = 'getObject';
    
    next();
}, presignedController);

async function presignedController(req, res, next) {
    const { bucketName, fileName } = req.params;
    const { operation } = res.locals;

    try {
        const url = await getPresignedUrl(bucketName, fileName, operation);

        return res.status(200).json({ url });
    } catch(e) {
        next(e);
    }
}

export const bucketRoutes = router;