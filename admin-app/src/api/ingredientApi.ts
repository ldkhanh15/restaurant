import api from './axiosConfig';

// Types
export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  barcode?: string;
  rfid?: string;
  min_stock_level: number;
  current_stock: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface CreateIngredientData {
  name: string;
  unit: string;
  barcode?: string;
  rfid?: string;
  min_stock_level: number;
  current_stock: number;
}

export interface UpdateIngredientData {
  name?: string;
  unit?: string;
  barcode?: string;
  rfid?: string;
  min_stock_level?: number;
  current_stock?: number;
}

const ingredientAPI = {
  // Basic CRUD
  getAll: () => 
    api.get('/ingredients'),
  
  getAllNoPaging: () => 
    api.get('/ingredients?all=true'),
  
  getById: (id: string) => 
    api.get(`/ingredients/${id}`),
  
  create: (data: CreateIngredientData) => 
    api.post('/ingredients', data),
  
  update: (id: string, data: UpdateIngredientData) => 
    api.put(`/ingredients/${id}`, data),
  
  remove: (id: string) => 
    api.delete(`/ingredients/${id}`),
};

export default ingredientAPI;
