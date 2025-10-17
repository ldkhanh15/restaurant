import { BaseService } from "./baseService"
import Table from "../models/Table"
import { stat } from "fs"

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
}

export default new TableService()
