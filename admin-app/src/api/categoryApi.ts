import api from './axiosConfig';
import { logger } from '../utils/logger';

export interface Category {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export class CategoryAPI {
  private baseURL = '/categories';

  // Get all categories
  async getCategories(): Promise<Category[]> {
    try {
      logger.api.request('GET /api/categories');
      
      const response = await api.get(this.baseURL);
      
      // Backend returns pagination object: {items, totalItems, totalPages, currentPage}
      const categories = response.data.data?.items || response.data.data || [];
      
      logger.api.response('GET /api/categories', {
        status: response.status,
        count: categories.length
      });

      return categories;
    } catch (error: any) {
      logger.api.error('GET /api/categories failed', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách danh mục');
    }
  }

  // Get category by ID
  async getCategoryById(id: string): Promise<Category> {
    try {
      logger.api.request(`GET /api/categories/${id}`);
      
      const response = await api.get(`${this.baseURL}/${id}`);
      
      logger.api.response(`GET /api/categories/${id}`, {
        status: response.status,
        categoryId: id
      });

      return response.data.data;
    } catch (error: any) {
      logger.api.error(`GET /api/categories/${id} failed`, error);
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin danh mục');
    }
  }

  // Create new category
  async createCategory(categoryData: CreateCategoryData): Promise<Category> {
    try {
      logger.api.request('POST /api/categories', { 
        name: categoryData.name
      });
      
      const response = await api.post(this.baseURL, categoryData);
      
      logger.api.response('POST /api/categories', {
        status: response.status,
        categoryId: response.data.data?.id
      });

      return response.data.data;
    } catch (error: any) {
      logger.api.error('POST /api/categories failed', error);
      throw new Error(error.response?.data?.message || 'Không thể tạo danh mục');
    }
  }

  // Update category
  async updateCategory(id: string, categoryData: UpdateCategoryData): Promise<Category> {
    try {
      logger.api.request(`PUT /api/categories/${id}`, categoryData);
      
      const response = await api.put(`${this.baseURL}/${id}`, categoryData);
      
      logger.api.response(`PUT /api/categories/${id}`, {
        status: response.status,
        categoryId: id
      });

      return response.data.data;
    } catch (error: any) {
      logger.api.error(`PUT /api/categories/${id} failed`, error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật danh mục');
    }
  }

  // Delete category
  async deleteCategory(id: string): Promise<void> {
    try {
      logger.api.request(`DELETE /api/categories/${id}`);
      
      const response = await api.delete(`${this.baseURL}/${id}`);
      
      logger.api.response(`DELETE /api/categories/${id}`, {
        status: response.status
      });
    } catch (error: any) {
      logger.api.error(`DELETE /api/categories/${id} failed`, error);
      throw new Error(error.response?.data?.message || 'Không thể xóa danh mục');
    }
  }

  // Toggle category active status
  async toggleCategoryStatus(id: string, isActive: boolean): Promise<Category> {
    try {
      logger.api.request(`PUT /api/categories/${id}/status`, { is_active: isActive });
      
      const response = await api.put(`${this.baseURL}/${id}`, { is_active: isActive });
      
      logger.api.response(`PUT /api/categories/${id}/status`, {
        status: response.status,
        isActive
      });

      return response.data.data;
    } catch (error: any) {
      logger.api.error(`PUT /api/categories/${id}/status failed`, error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật trạng thái danh mục');
    }
  }
}

export const categoryAPI = new CategoryAPI();
