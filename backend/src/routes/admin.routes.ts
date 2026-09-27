import { Router } from 'express';
import {
  getDashboardStats,
  listAllOrders,
  updateOrderStatus,
} from '../controllers/order.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/orders', listAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);

export default router;
