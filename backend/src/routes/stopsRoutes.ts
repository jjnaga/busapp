import express from 'express';
import { getAllStops, getStopsInBoundingBox } from '@controllers/stopsController';

const router = express.Router();

router.get('/', getAllStops);
router.get('/bbox', getStopsInBoundingBox);

export default router;
