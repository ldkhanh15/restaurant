import api from './axiosConfig';

// Types
export interface Voucher {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  value: string | number;
  min_order_value: number | null;
  current_uses: number;
  max_uses: number;
  active: boolean;
  expiry_date?: string | null;
  created_at: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
}

export interface CreateVoucherData {
  code: string;
  discount_type: 'percentage' | 'fixed';
  value: string | number;
  min_order_value?: number;
  max_uses: number;
  active?: boolean;
  expiry_date?: string;
}

export interface UpdateVoucherData {
  code?: string;
  discount_type?: 'percentage' | 'fixed';
  value?: string | number;
  min_order_value?: number;
  max_uses?: number;
  active?: boolean;
  expiry_date?: string;
}

const voucherAPI = {
  // Basic CRUD
  getAll: () => 
    api.get('/vouchers'),
  
  getById: (id: string) => 
    api.get(`/vouchers/${id}`),
  
  create: (data: CreateVoucherData) => 
    api.post('/vouchers', data),
  
  update: (id: string, data: UpdateVoucherData) => 
    api.put(`/vouchers/${id}`, data),
  
  remove: (id: string) => 
    api.delete(`/vouchers/${id}`),
};

export default voucherAPI;
