import { config } from 'dotenv';
config();
import { addJob } from '@utils/bullmq';
import '@utils/worker';

(async () => {
  addJob('fetch-vehicles');
})();
