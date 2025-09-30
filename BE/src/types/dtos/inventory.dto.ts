import { InventoryImportAttributes } from "../../models/inventoryImport.model";

export interface CreateInventoryImportDTO {
  supplier_id: string;
  ingredients: {
    ingredient_id: string;
    quantity: number;
    unit_price: number;
    expiry_date?: Date;
    batch_number?: string;
  }[];
  total_price?: number;
  payment_status?: "pending" | "paid" | "partial";
  payment_due_date?: Date;
  notes?: string;
  received_by?: string;
}

export interface UpdateInventoryImportDTO
  extends Partial<Omit<CreateInventoryImportDTO, "ingredients">> {
  ingredients?: {
    id: string;
    quantity?: number;
    unit_price?: number;
    expiry_date?: Date;
  }[];
}

export interface InventoryAdjustmentDTO {
  ingredient_id: string;
  quantity_change: number;
  reason: string;
  adjusted_by: string;
  notes?: string;
  reference_type?: string;
  reference_id?: string;
}

export interface InventoryTransferDTO {
  from_location: string;
  to_location: string;
  ingredients: {
    ingredient_id: string;
    quantity: number;
    notes?: string;
  }[];
  transferred_by: string;
  reason?: string;
}
