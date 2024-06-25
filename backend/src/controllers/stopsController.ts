import { Request, Response } from 'express';
import { fetchAllStops, fetchStopsInBoundingBox } from '@logic/stops';
import { BoundingBox } from '@utils/types';

const getAllStops = async (req: Request, res: Response) => {
  try {
    const data = await fetchAllStops();
    console.log('data found,', data);

    return res.status(200).json({ status: 'success', message: `${data.length} rows`, data });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ status: 'failure', error: errorMessage });
  }
};

const getStopsInBoundingBox = async (req: Request, res: Response) => {
  try {
    const { topLeftX, topLeftY, bottomRightX, bottomRightY } = req.query;

    // Check for missing URL params.
    const missingParams = ['topLeftX', 'topLeftY', 'bottomRightX', 'bottomRightY'].filter((param) => !req.query[param]);

    if (missingParams.length > 0) {
      return res.status(400).json({
        status: 'fail',
        message: `Missing URL Params: ${missingParams}`,
      });
    }

    // Parse query parameters into the BoundingBox type
    const boundingBox: BoundingBox = {
      topLeft: { x: parseFloat(topLeftX as string), y: parseFloat(topLeftY as string) },
      bottomRight: { x: parseFloat(bottomRightX as string), y: parseFloat(bottomRightY as string) },
    };

    const data = await fetchStopsInBoundingBox(boundingBox);

    return res.status(200).json({ status: 'success', message: `${data.length} rows`, data });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ status: 'failure', error: errorMessage });
  }
};

export { getAllStops, getStopsInBoundingBox };
