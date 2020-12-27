import { Router } from 'express';
import cos from './cos';

const router = Router();


router.use('/download', async (req, res, next) => {
    try {
        const url = await cos.getPresignedDownloadUrl();

        return res.status(200).json({ url });
    } catch(e) {
        next(e);
    }
});

router.use('/upload', async (req, res, next) => {

});

export const presignedRoutes = router;