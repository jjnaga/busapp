import express from 'express';
import { postRequest, postSubscription } from '@controllers/notificationsController';

const router = express.Router();

router.post('/subscribe', postSubscription);
router.post('/request', postRequest);
// router.get('/:stopNumber', getSingleStopData);
// router.get('/bbox', getStopsInBoundingBox);

export default router;
