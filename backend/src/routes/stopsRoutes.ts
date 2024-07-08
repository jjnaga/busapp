import express from 'express';
import { getAllStops, getSingleStopData, getStopsInBoundingBox } from '@controllers/stopsController';

const router = express.Router();

router.get('/', getAllStops);
router.get('/:stopNumber', getSingleStopData);
router.get('/bbox', getStopsInBoundingBox);

export default router;
