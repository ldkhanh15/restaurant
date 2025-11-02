import { BaseService } from "./baseService"
import Table from "../models/Table"
import { stat } from "fs"
import { Op } from "sequelize"

class TableService extends BaseService<Table> {
  constructor() {
    super(Table)
  }

  async findTablesByStatus(status:string, options?: any) {
    return await this.findAll({
      ...options,
      where: { 
        status: status,
      },
    })
  }

  async search(params: any) {
    const where: any = {}

    // --- Bộ lọc linh hoạt ---
    if (params.table_number) {
      where.table_number = { [Op.like]: `%${params.table_number}%` }
    }

    if (params.status) {
      where.status = params.status
    }

    if (params.capacity_min || params.capacity_max || params.capacity_exact) {
      if (params.capacity_exact) {
        where.capacity = +params.capacity_exact
      } else {
        where.capacity = {}
        if (params.capacity_min) where.capacity[Op.gte] = +params.capacity_min
        if (params.capacity_max) where.capacity[Op.lte] = +params.capacity_max
      }
    }

    if (params.deposit_min || params.deposit_max || params.deposit_exact) {
      if (params.deposit_exact) {
        where.deposit = +params.deposit_exact
      } else {
        where.deposit = {}
        if (params.deposit_min) where.deposit[Op.gte] = +params.deposit_min
        if (params.deposit_max) where.deposit[Op.lte] = +params.deposit_max
      }
    }

    if (params.cancel_minutes_min || params.cancel_minutes_max) {
      where.cancel_minutes = {}
      if (params.cancel_minutes_min) where.cancel_minutes[Op.gte] = +params.cancel_minutes_min
      if (params.cancel_minutes_max) where.cancel_minutes[Op.lte] = +params.cancel_minutes_max
    }

    // --- Phân trang và sắp xếp ---
    const page = params.page ? +params.page : 1
    const limit = params.limit ? +params.limit : 10
    const offset = (page - 1) * limit
    const sortBy = params.sortBy || "created_at"
    const sortOrder = (params.sortOrder || "ASC").toUpperCase()

    // --- Thực thi truy vấn ---
    const { count, rows } = await this.model.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    })

    return { count, rows, page, limit }
  }
}

export default new TableService()
