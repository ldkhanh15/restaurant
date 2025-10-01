import type { Model, ModelStatic, FindOptions, WhereOptions } from "sequelize"
import { AppError } from "../middlewares/errorHandler"

export class BaseService<T extends Model> {
  protected model: ModelStatic<T>

  constructor(model: ModelStatic<T>) {
    this.model = model
  }

  async findAll(options?: FindOptions): Promise<{ rows: T[]; count: number }> {
    const { count, rows } = await this.model.findAndCountAll(options)
    return { rows, count }
  }

  async findById(id: string, options?: FindOptions): Promise<T> {
    const record = await this.model.findByPk(id, options)
    if (!record) {
      throw new AppError(`${this.model.name} not found`, 404)
    }
    return record
  }

  async findOne(where: WhereOptions, options?: FindOptions): Promise<T | null> {
    return await this.model.findOne({ where, ...options })
  }

  async create(data: any): Promise<T> {
    return await this.model.create(data)
  }

  async update(id: string, data: any): Promise<T> {
    const record = await this.findById(id)
    await record.update(data)
    return record
  }

  async delete(id: string): Promise<void> {
    const record = await this.findById(id)
    await record.destroy()
  }

  async softDelete(id: string): Promise<T> {
    const record = await this.findById(id)
    await record.update({ deletedAt: new Date() })
    return record
  }
}
