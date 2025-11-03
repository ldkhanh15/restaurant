import { BaseService } from "./baseService"
import InventoryImport from "../models/InventoryImport"
import { Employee, Supplier, User } from "../models"

class inventoryService extends BaseService< InventoryImport> {
  constructor() {
    super(InventoryImport)
  }

  async findAllWithDetails(options?: any) {
    return await this.findAll({
      ...options,
      include: [
        { model: Supplier, as: "supplier" },
        { model: Employee, as: "employee",
          where: { deleted_at: null },
          include:[
            {
              model : User, as : "user",
              attributes: ["full_name"],
            }
          ]
        },
      ],
    })
  }
}

export default new inventoryService()
