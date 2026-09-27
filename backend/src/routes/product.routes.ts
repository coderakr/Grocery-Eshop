import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from '../controllers/product.controller.js';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, listProducts);
router.get('/:idOrSlug', optionalAuth, getProduct);

router.post('/', authenticate, requireAdmin, createProduct);
router.patch('/:id', authenticate, requireAdmin, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

export default router;
