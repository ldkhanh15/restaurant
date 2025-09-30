import { Router } from 'express';
import { OrderController } from './order.controller';

const router = Router();

router.get('/', OrderController.list);
router.get('/:id', OrderController.get);
router.post('/', OrderController.create);
router.put('/:id', OrderController.update);

export default router;
