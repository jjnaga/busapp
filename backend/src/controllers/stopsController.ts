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

    if (!topLeftX) {
      res.status(400).send('Missing required query parameter: topLeftX');
      return;
    }

    if (!topLeftY) {
      res.status(400).send('Missing required query parameter: topLeftY');
      return;
    }

    if (!bottomRightX) {
      res.status(400).send('Missing required query parameter: bottomRightX');
      return;
    }

    if (!bottomRightY) {
      res.status(400).send('Missing required query parameter: bottomRightY');
      return;
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
