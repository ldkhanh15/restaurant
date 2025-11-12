import type { Model, ModelStatic, FindOptions, WhereOptions } from "sequelize";
import { AppError } from "../middlewares/errorHandler";
import { User } from "../models";

export class BaseService<T extends Model> {
  protected model: ModelStatic<T>;

  constructor(model: ModelStatic<T>) {
    this.model = model;
  }

  async findAll(options?: FindOptions): Promise<{ rows: T[]; count: number }> {
    const { count, rows } = await this.model.findAndCountAll(options);
    return { rows, count };
  }

  async findById(id: string, options?: FindOptions): Promise<T> {
    const record = await this.model.findByPk(id, options);
    if (!record) {
      throw new AppError(`${this.model.name} not found`, 404);
    }
    return record;
  }

  async findOne(where: WhereOptions, options?: FindOptions): Promise<T | null> {
    return await this.model.findOne({ where, ...options });
  }

  async create(data: any): Promise<T> {
    return await this.model.create(data);
  }

  async update(id: string, data: any): Promise<T> {
    const record = await this.findById(id);
    await record.update(data);
    return record;
  }

  async delete(id: string): Promise<void> {
    const record = await this.findById(id);
    await record.destroy();
  }

  async softDelete(id: string): Promise<T> {
    const record = await this.findById(id);
    await record.update({ deleted_at: new Date() });
    return record;
  }

  async restore(id: string): Promise<T> {
    const record = await this.findById(id, { paranoid: false });
    await record.restore();
    return record;
  }

  async findByDishId(dishId: string, options?: FindOptions): Promise<T[]> {
    return await this.model.findAll({
      where: { dish_id: dishId },
      include: [
        {
          model: User, // include model User
          as: "user", // alias defined in association
          attributes: ["id", "username", "email"], // lấy những field cần thiết
        },
      ],
      ...options, // cho phép ghi đè thêm options khác nếu có
    });
  }
}
