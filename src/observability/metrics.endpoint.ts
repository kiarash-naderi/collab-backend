import { Router } from 'express';
import { register } from './metrics.service.js';

const router = Router();

router.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', register.contentType);
  const metrics = await register.metrics();
  res.send(metrics);
});

export default router;