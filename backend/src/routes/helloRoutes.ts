import express from 'express';
import { getHelloWorld } from '@controllers/helloController';

const router = express.Router();

router.get('/', getHelloWorld);

export default router;
