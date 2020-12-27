import { Router } from 'express';
import { getPresignedDownloadUrl } from './cos';

const router = Router();


router.use('/download', async (req, res, next) => {
    const { bucket, fileName } = req.params;

    try {
        const url = await getPresignedDownloadUrl(bucket, fileName);

        return res.status(200).json({ url });
    } catch(e) {
        next(e);
    }
});

router.use('/upload', async (req, res, next) => {

});

export const presignedRoutes = router;