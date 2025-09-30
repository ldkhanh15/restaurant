import { BaseService } from "./baseService"
import Supplier from "../models/Supplier"

class SupplierService extends BaseService<Supplier> {
  constructor() {
    super(Supplier)
  }
}

export default new SupplierService()
