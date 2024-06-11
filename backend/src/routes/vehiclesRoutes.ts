import express from 'express';
import { getAllVehicles, getOneVehicle } from '@controllers/vehiclesController';

const router = express.Router();

router.get('/', getAllVehicles);
router.get('/:vehicleNumber', getOneVehicle);

export default router;
