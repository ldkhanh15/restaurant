import { BaseService } from "./baseService";
import Complaint from "../models/Complaint";
import User from "../models/User";
import { Order, OrderItem } from "../models";

class ComplaintService extends BaseService<Complaint> {
  constructor() {
    super(Complaint);
  }

  async findAllWithUser(options?: any) {
    return await this.findAll({
      ...options,
      include: [
        { model: User, as: "user" },
        { model: Order, as: "order" },
        { model: OrderItem, as: "orderItem" },
      ],
    });
  }
}

export default new ComplaintService();
