import { BaseService } from "./baseService"
import InventoryImport from "../models/InventoryImport"
import { Employee, Supplier } from "../models"

class inventoryService extends BaseService< InventoryImport> {
  constructor() {
    super(InventoryImport)
  }

  async findAllWithDetails(options?: any) {
    return await this.findAll({
      ...options,
      include: [
        { model: Supplier, as: "supplier" },
        { model: Employee, as: "employee" },
      ],
    })
  }
}

export default new inventoryService()
