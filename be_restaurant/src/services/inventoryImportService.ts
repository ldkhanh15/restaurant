import { BaseService } from "./baseService"
import InventoryImport from "../models/InventoryImport"
import Supplier from "../models/Supplier"
import Employee from "../models/Employee"

class InventoryImportService extends BaseService<InventoryImport> {
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

export default new InventoryImportService()
