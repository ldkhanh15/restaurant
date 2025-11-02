import api from './axiosConfig';
import { logger } from '../utils/logger';

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  slug?: string;
  author_id?: string;
  author?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  category?: string;
  status: 'draft' | 'published' | 'archived';
  views?: number;
  created_at: string;
  updated_at: string;
  featured_image?: string;
  tags?: string[];
}

export interface CreateBlogData {
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  status?: 'draft' | 'published';
  featured_image?: string;
  tags?: string[];
}

export interface UpdateBlogData extends Partial<CreateBlogData> {
  id: string;
}

export interface BlogListResponse {
  data: BlogPost[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

export class BlogAPI {
  private baseURL = '/blog'; // Backend route is /api/blog

  async getBlogs(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<BlogListResponse> {
    try {
      logger.api.request('GET /api/blog', params);
      
      const response: any = await api.get(this.baseURL, { params });
      
      logger.api.response('GET /api/blog', {
        status: 200,
        dataLength: Array.isArray(response?.data) ? response.data.length : (response?.length || 0)
      });

      // Response is already unwrapped by interceptor
      // Check if response has pagination structure
      if (response?.data && response?.pagination) {
        return {
          data: response.data || [],
          pagination: response.pagination
        };
      }
      
      // If response is just an array
      if (Array.isArray(response)) {
        return {
          data: response,
          pagination: {
            current_page: 1,
            total_pages: 1,
            total_items: response.length,
            items_per_page: response.length
          }
        };
      }

      // Fallback
      return {
        data: [],
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: 0,
          items_per_page: 10
        }
      };
    } catch (error: any) {
      logger.api.error('GET /api/blog failed', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách blog');
    }
  }

  async getBlogById(id: string): Promise<BlogPost> {
    try {
      logger.api.request(`GET /api/blog/${id}`);
      
      const response: any = await api.get(`${this.baseURL}/${id}`);
      
      logger.api.response(`GET /api/blog/${id}`, {
        status: 200,
        blogId: id
      });

      // Response already unwrapped by interceptor
      return response as BlogPost;
    } catch (error: any) {
      logger.api.error(`GET /api/blog/${id} failed`, error);
      throw new Error(error.response?.data?.message || 'Không thể tải blog');
    }
  }

  async createBlog(data: CreateBlogData): Promise<BlogPost> {
    try {
      logger.api.request('POST /api/blog', { title: data.title });
      
      const response: any = await api.post(this.baseURL, data);
      
      logger.api.response('POST /api/blog', {
        status: 200,
        blogId: response?.id
      });

      // Response already unwrapped by interceptor
      return response as BlogPost;
    } catch (error: any) {
      logger.api.error('POST /api/blog failed', error);
      throw new Error(error.response?.data?.message || 'Không thể tạo blog');
    }
  }

  async updateBlog(id: string, data: Partial<CreateBlogData>): Promise<BlogPost> {
    try {
      logger.api.request(`PUT /api/blog/${id}`, { title: data.title });
      
      const response: any = await api.put(`${this.baseURL}/${id}`, data);
      
      logger.api.response(`PUT /api/blog/${id}`, {
        status: 200,
        blogId: id
      });

      // Response already unwrapped by interceptor
      return response as BlogPost;
    } catch (error: any) {
      logger.api.error(`PUT /api/blog/${id} failed`, error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật blog');
    }
  }

  async deleteBlog(id: string): Promise<void> {
    try {
      logger.api.request(`DELETE /api/blog/${id}`);
      
      await api.delete(`${this.baseURL}/${id}`);
      
      logger.api.response(`DELETE /api/blog/${id}`, {
        status: 200
      });
    } catch (error: any) {
      logger.api.error(`DELETE /api/blog/${id} failed`, error);
      throw new Error(error.response?.data?.message || 'Không thể xóa blog');
    }
  }

  async getPublishedBlogs(): Promise<BlogPost[]> {
    try {
      logger.api.request('GET /api/blog/published');
      
      const response: any = await api.get(`${this.baseURL}/published`);
      
      logger.api.response('GET /api/blog/published', {
        status: 200,
        dataLength: Array.isArray(response) ? response.length : 0
      });

      // Response already unwrapped by interceptor
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      logger.api.error('GET /api/blog/published failed', error);
      throw new Error(error.response?.data?.message || 'Không thể tải blog đã xuất bản');
    }
  }
}

export const blogAPI = new BlogAPI();
export default blogAPI;