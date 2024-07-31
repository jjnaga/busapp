import { Request, Response } from 'express';
import { fetchAllVehicles, fetchOneVehicle } from '@logic/vehicles';
import { addRequest, addSubscription } from '@logic/notifications';

const postRequest = async (req: Request, res: Response) => {
  try {
    const json = req.body;
    const { subscription, type, notificationDate, stopId, busId } = json;

    if (!subscription) {
      return res.status(500).json({ status: 'failure', error: '"subscription" missing' });
    }

    if (!type) {
      return res.status(500).json({ status: 'failure', error: '"type" missing' });
    }

    if (!notificationDate) {
      return res.status(500).json({ status: 'failure', error: '"type" missing' });
    }

    const data = await addRequest({
      subscription,
      notificationData: {
        type,
        stopId,
        busId,
      },
      notificationDate,
    });

    return res.status(200).json({ status: 'success', data });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ status: 'failure', error: errorMessage });
  }
};

const postSubscription = async (req: Request, res: Response) => {
  try {
    const subscription = req.body;
    console.log('huh', typeof req.body);
    const id = await addSubscription(subscription);

    return res.status(200).json({ status: 'success', subscription_id: id });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ status: 'failure', error: errorMessage });
  }
};
export { postRequest, postSubscription };
