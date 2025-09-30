import { Request, Response } from 'express';
import { OrderService } from './order.service';

export const OrderController = {
  async list(_req: Request, res: Response) {
    const data = await OrderService.list();
    res.json({ data });
  },
  async get(req: Request, res: Response) {
    const data = await OrderService.get(req.params.id);
    if (!data) return res.status(404).json({ message: 'Order not found' });
    res.json({ data });
  },
  async create(req: Request, res: Response) {
    const data = await OrderService.create(req.body);
    res.status(201).json({ data });
  },
  async update(req: Request, res: Response) {
    const data = await OrderService.update(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: 'Order not found' });
    res.json({ data });
  }
};
