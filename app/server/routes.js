import { Router } from 'express';
import { getPresignedUrl } from './cos';

const router = Router();

router.use('/upload', async (req, res, next) => {
    res.locals.operation = 'putObject';
    
    next();
}, controller);

router.use('/download', async (req, res, next) => {  
    res.locals.operation = 'getObject';
    
    next();
}, controller);

async function controller(req, res, next) {
    const { bucket, fileName } = req.query;
    const { operation } = res.locals;

    try {
        const url = await getPresignedUrl(bucket, fileName, operation);

        return res.status(200).json({ url });
    } catch(e) {
        next(e);
    }
}

export const presignedRoutes = router;