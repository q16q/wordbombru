import { Router } from 'express';
import apiRouter from './api';

const router = Router();

// Base routes
router.get('/', (req, res) => {
    res.json({ status: 'ok' });
});

// API routes
router.use('/api', apiRouter);

export default router;
