// ESM syntax is supported.
import express from 'express';
import cors from 'cors';
import { bucketRoutes } from './routes';

const PORT = 3030;

const app = express();
app.use(express.json());
app.use(cors());

app.use('/health', (req, res) => res.json('API is up and running!'));

app.use('/api/buckets', bucketRoutes);

app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
});
