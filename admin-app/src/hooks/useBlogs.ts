import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

// Mock interface for blog posts since API might not have blog endpoints yet
interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  author: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  views: number;
  created_at: string;
  updated_at: string;
  featured_image?: string;
}

interface CreateBlogData {
  title: string;
  content: string;
  category: string;
  excerpt?: string;
}

// Mock data for demonstration
const mockBlogs: BlogPost[] = [
  {
    id: '1',
    title: "Bí quyết nấu phở bò ngon như quán",
    content: "Khám phá bí quyết nấu nước dùng phở trong vắt, thơm ngon...",
    excerpt: "Khám phá bí quyết nấu nước dùng phở trong vắt, thơm ngon.",
    author: "Bếp trưởng Minh",
    category: "Công thức",
    status: "published",
    views: 1250,
    created_at: "2024-03-14T00:00:00.000Z",
    updated_at: "2024-03-14T00:00:00.000Z"
  },
  {
    id: '2',
    title: "Thực đơn mùa xuân 2024",
    content: "Giới thiệu các món ăn mới trong thực đơn mùa xuân...",
    excerpt: "Giới thiệu các món ăn mới trong thực đơn mùa xuân.",
    author: "Quản lý Lan", 
    category: "Thực đơn",
    status: "published",
    views: 890,
    created_at: "2024-03-08T00:00:00.000Z",
    updated_at: "2024-03-08T00:00:00.000Z"
  },
  {
    id: '3',
    title: "Cách trình bày món ăn đẹp mắt",
    content: "Hướng dẫn trình bày món ăn chuyên nghiệp...",
    excerpt: "Hướng dẫn trình bày món ăn chuyên nghiệp.",
    author: "Bếp phó Hùng",
    category: "Kỹ thuật",
    status: "draft",
    views: 0,
    created_at: "2024-03-10T00:00:00.000Z",
    updated_at: "2024-03-10T00:00:00.000Z"
  }
];

export const useBlogs = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>(mockBlogs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📝 Hook: Fetching blogs...');
      // TODO: Replace with actual API call when available
      // const response = await restaurantApi.blogs.blogsList();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setBlogs(mockBlogs);
      console.log('✅ Hook: Blogs loaded successfully:', mockBlogs.length);
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi tải danh sách blog';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBlog = useCallback(async (data: CreateBlogData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📝 Hook: Creating blog:', data);
      // TODO: Replace with actual API call when available
      // const response = await restaurantApi.blogs.blogsCreate(data);
      
      const newBlog: BlogPost = {
        id: Date.now().toString(),
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || data.content.substring(0, 100),
        author: 'Admin',
        category: data.category,
        status: 'draft',
        views: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setBlogs(prev => [newBlog, ...prev]);
      Alert.alert('Thành công', 'Tạo blog thành công!');
      console.log('✅ Hook: Blog created successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi tạo blog';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error creating blog:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBlog = useCallback(async (id: string, data: Partial<CreateBlogData>) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📝 Hook: Updating blog:', id, data);
      // TODO: Replace with actual API call when available
      // const response = await restaurantApi.blogs.blogsUpdate(id, data);
      
      setBlogs(prev => prev.map(blog => 
        blog.id === id 
          ? { ...blog, ...data, updated_at: new Date().toISOString() }
          : blog
      ));
      
      Alert.alert('Thành công', 'Cập nhật blog thành công!');
      console.log('✅ Hook: Blog updated successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi cập nhật blog';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error updating blog:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBlog = useCallback(async (id: string) => {
    try {
      setLoading(true);
      
      console.log('📝 Hook: Deleting blog:', id);
      // TODO: Replace with actual API call when available
      // const response = await restaurantApi.blogs.blogsDelete(id);
      
      setBlogs(prev => prev.filter(blog => blog.id !== id));
      Alert.alert('Thành công', 'Xóa blog thành công!');
      console.log('✅ Hook: Blog deleted successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi xóa blog';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error deleting blog:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const publishBlog = useCallback(async (id: string) => {
    try {
      console.log('📝 Hook: Publishing blog:', id);
      // TODO: Replace with actual API call when available
      
      setBlogs(prev => prev.map(blog => 
        blog.id === id 
          ? { ...blog, status: 'published' as const, updated_at: new Date().toISOString() }
          : blog
      ));
      
      Alert.alert('Thành công', 'Xuất bản blog thành công!');
      console.log('✅ Hook: Blog published successfully');
      return true;
    } catch (err: any) {
      console.error('❌ Hook: Error publishing blog:', err);
      return false;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  return {
    blogs,
    loading,
    error,
    fetchBlogs,
    createBlog,
    updateBlog,
    deleteBlog,
    publishBlog,
    refresh
  };
};

export type { BlogPost, CreateBlogData };