import { Router } from 'express';
import {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from '../controllers/cart.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/', addToCart);
router.delete('/', clearCart);
router.patch('/:itemId', updateCartItem);
router.delete('/:itemId', removeCartItem);

export default router;
