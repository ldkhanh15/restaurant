import { BaseService } from "./baseService"
import Table from "../models/Table"

class TableService extends BaseService<Table> {
  constructor() {
    super(Table)
  }

  async findAvailableTables() {
    return await this.model.findAll({
      where: { status: "available" },
    })
  }
}

export default new TableService()
