import { BaseService } from "./baseService"
import TableGroup from "../models/TableGroup"

class TableGroupService extends BaseService<TableGroup> {
  constructor() {
    super(TableGroup)
  }
}

export default new TableGroupService()
