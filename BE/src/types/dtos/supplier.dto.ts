import { SupplierAttributes } from "../../models/supplier.model";

export interface CreateSupplierDTO {
  name: string;
  contact_info: {
    email?: string;
    phone?: string;
    address?: string;
    contact_person?: string;
  };
  tax_info?: string;
  payment_terms?: string;
  delivery_terms?: string;
  active?: boolean;
  rating?: number;
  notes?: string;
}

export interface UpdateSupplierDTO extends Partial<CreateSupplierDTO> {}
