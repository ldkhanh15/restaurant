import { BaseService } from "./baseService"
import Table from "../models/Table"

export const TABLE_ALLOWED_STATUSES = ["available", "reserved", "occupied", "cleaning"] as const

class TableService extends BaseService<Table> {
  constructor() {
    super(Table)
  }

  async findAvailableTables() {
    return await this.model.findAll({
      where: { status: "available" },
    })
  }

  async updateStatus(id: string, status: (typeof TABLE_ALLOWED_STATUSES)[number]) {
    const table = await this.findById(id)
    await table.update({ status })
    return table
  }
}

export default new TableService()
