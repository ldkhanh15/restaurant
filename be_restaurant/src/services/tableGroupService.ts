import { BaseService } from "./baseService"
import TableGroup from "../models/TableGroup"
import { literal, Op } from "sequelize"

class TableGroupService extends BaseService<TableGroup> {
  constructor() {
    super(TableGroup)
  }

  async checkExistedTablesInGroup(tableIds: string[], currentGroupId?: string) {
    if (!tableIds?.length) return null
    const jsonConditions = tableIds.map(
      (id) => literal(`JSON_CONTAINS(table_ids, '["${id}"]')`)
    )
    return await this.model.findOne({
      where: {
        deleted_at: null,
        ...(currentGroupId ? { id: { [Op.ne]: currentGroupId } } : {}),
        [Op.or]: jsonConditions, 
      },
    })
  }
}

export default new TableGroupService()
