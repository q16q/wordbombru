import { Router } from 'express';

const router = Router();

// API routes
router.get('/', (req, res) => {
	res.json({ status: 'ok' });
});

export default router;
