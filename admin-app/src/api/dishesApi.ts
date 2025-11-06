import api from './axiosConfig';
import { logger } from '../utils/logger';

export interface Dish {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  image_url?: string;
  category_id: string;
  active: boolean;
  is_available?: boolean;
  preparation_time?: number;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
  } | string;
}

export interface CreateDishData {
  name: string;
  description?: string;
  price: number;
  image?: string;
  image_url?: string;
  category_id: string;
  active?: boolean;
  is_available?: boolean;
  preparation_time?: number;
}

export interface UpdateDishData {
  name?: string;
  description?: string;
  price?: number;
  image?: string;
  image_url?: string;
  category_id?: string;
  active?: boolean;
  is_available?: boolean;
  preparation_time?: number;
}

export interface DishFilters {
  category_id?: string;
  active?: boolean;
  search?: string;
}

export class DishesAPI {
  private baseURL = '/dishes'; // FIXED: Loại bỏ /api prefix

  // Get all dishes with filters
  async getDishes(filters?: DishFilters): Promise<Dish[]> {
    try {
      logger.api.request('GET /api/dishes', filters);
      
      const response = await api.get(this.baseURL, { params: filters });
      
      // Backend returns pagination object: {items, totalItems, totalPages, currentPage}
      // Extract items array from pagination
      const dishes = response.data.data?.items || response.data.data || [];
      
      logger.api.response('GET /api/dishes', {
        status: response.status,
        count: dishes.length
      });

      return dishes;
    } catch (error: any) {
      logger.api.error('GET /api/dishes failed', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách món ăn');
    }
  }

  // Get dish by ID
  async getDishById(id: string): Promise<Dish> {
    try {
      logger.api.request(`GET /api/dishes/${id}`);
      
      const response = await api.get(`${this.baseURL}/${id}`);
      
      logger.api.response(`GET /api/dishes/${id}`, {
        status: response.status,
        dishId: id
      });

      return response.data.data;
    } catch (error: any) {
      logger.api.error(`GET /api/dishes/${id} failed`, error);
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin món ăn');
    }
  }

  // Create new dish
  async createDish(dishData: CreateDishData): Promise<Dish> {
    try {
      logger.api.request('POST /api/dishes', { 
        name: dishData.name,
        price: dishData.price
      });
      
      const response = await api.post(this.baseURL, dishData);
      
      logger.api.response('POST /api/dishes', {
        status: response.status,
        dishId: response.data.data?.id
      });

      return response.data.data;
    } catch (error: any) {
      logger.api.error('POST /api/dishes failed', error);
      throw new Error(error.response?.data?.message || 'Không thể tạo món ăn');
    }
  }

  // Update dish
  async updateDish(id: string, dishData: UpdateDishData): Promise<Dish> {
    try {
      logger.api.request(`PUT /api/dishes/${id}`, dishData);
      
      const response = await api.put(`${this.baseURL}/${id}`, dishData);
      
      logger.api.response(`PUT /api/dishes/${id}`, {
        status: response.status,
        dishId: id
      });

      return response.data.data;
    } catch (error: any) {
      logger.api.error(`PUT /api/dishes/${id} failed`, error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật món ăn');
    }
  }

  // Delete dish
  async deleteDish(id: string): Promise<void> {
    try {
      logger.api.request(`DELETE /api/dishes/${id}`);
      
      const response = await api.delete(`${this.baseURL}/${id}`);
      
      logger.api.response(`DELETE /api/dishes/${id}`, {
        status: response.status
      });
    } catch (error: any) {
      logger.api.error(`DELETE /api/dishes/${id} failed`, error);
      throw new Error(error.response?.data?.message || 'Không thể xóa món ăn');
    }
  }

  // Toggle dish active status
  async toggleDishStatus(id: string): Promise<Dish> {
    try {
      const dish = await this.getDishById(id);
      return await this.updateDish(id, { active: !dish.active });
    } catch (error: any) {
      throw new Error(error.message || 'Không thể thay đổi trạng thái món ăn');
    }
  }
}

export const dishesAPI = new DishesAPI();
export default dishesAPI;