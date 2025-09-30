import { Request, Response } from 'express';
import { UserService } from './user.service';

export const UserController = {
  async list(_req: Request, res: Response) {
    const data = await UserService.list(); res.json({ data });
  },
  async get(req: Request, res: Response) {
    const data = await UserService.get(req.params.id);
    if (!data) return res.status(404).json({ message: 'User not found' });
    res.json({ data });
  },
  async create(req: Request, res: Response) {
    const data = await UserService.create(req.body);
    res.status(201).json({ data });
  },
  async update(req: Request, res: Response) {
    const data = await UserService.update(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: 'User not found' });
    res.json({ data });
  },
  async remove(req: Request, res: Response) {
    const ok = await UserService.remove(req.params.id);
    if (!ok) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true });
  }
};
