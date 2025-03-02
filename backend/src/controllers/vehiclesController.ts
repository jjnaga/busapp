import { Request, Response } from 'express';
import { fetchAllVehicles, fetchOneVehicle, fetchTripShape } from '@logic/vehicles';

const getAllVehicles = async (req: Request, res: Response) => {
  try {
    const data = await fetchAllVehicles();

    return res.status(200).json({ status: 'success', data });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ status: 'failure', error: errorMessage });
  }
};

const getOneVehicle = async (req: Request, res: Response) => {
  try {
    const { vehicleNumber } = req.params;

    if (!vehicleNumber) {
      return res.status(400).json({ error: 'Bus number Parameter is required.' });
    }

    const data = await fetchOneVehicle(vehicleNumber);

    return res.status(200).json({ status: 'success', data });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ status: 'failure', error: errorMessage });
  }
};

const getTripShape = async (req: Request, res: Response) => {
  try {
    const { vehicleNumber } = req.params;

    if (!vehicleNumber) {
      return res.status(400).json({
        status: 'failure',
        error: 'Vehicle number parameter is required.',
      });
    }

    const data = await fetchTripShape(vehicleNumber);

    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return res.status(404).json({
      status: 'failure',
      error: errorMessage,
    });
  }
};

export { getAllVehicles, getOneVehicle, getTripShape };
