import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { BlogAPI, BlogPost, CreateBlogData } from '../api/blog';

const blogAPI = new BlogAPI();

export const useBlogs = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📝 Hook: Fetching blogs from API...');
      
      const response = await blogAPI.getBlogs();
      
      setBlogs(response.data || []);
      
      console.log('✅ Hook: Blogs loaded successfully:', response.data.length);
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
      
      const newBlog = await blogAPI.createBlog(data);
      
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
      
      const updatedBlog = await blogAPI.updateBlog(id, data);
      
      setBlogs(prev => prev.map(blog => 
        blog.id === id ? updatedBlog : blog
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
      
      await blogAPI.deleteBlog(id);
      
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
      
      await blogAPI.updateBlog(id, { status: 'published' });
      
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