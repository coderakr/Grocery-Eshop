import { Router } from 'express';
import {
  createOrder,
  getMyOrder,
  listMyOrders,
} from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', createOrder);
router.get('/', listMyOrders);
router.get('/:id', getMyOrder);

export default router;
