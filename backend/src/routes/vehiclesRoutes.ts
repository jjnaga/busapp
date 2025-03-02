import express from 'express';
import { getAllVehicles, getOneVehicle, getTripShape } from '@controllers/vehiclesController';

const router = express.Router();

router.get('/', getAllVehicles);
router.get('/:vehicleNumber', getOneVehicle);
router.get('/:vehicleNumber/shape', getTripShape);

export default router;
