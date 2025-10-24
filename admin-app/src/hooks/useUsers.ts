import { useState, useEffect, useCallback } from 'react';
import { 
  getUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser, 
  User,
  UsersResponse,
  UserFilters,
  CreateUserData,
  UpdateUserData 
} from '../api/users';
import { Alert } from 'react-native';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
  });

  const fetchUsers = useCallback(async (filters?: UserFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getUsers(filters);
      
      setUsers(response.users);
      setPagination({
        total: response.total,
        totalPages: response.totalPages,
        currentPage: response.currentPage,
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi tải danh sách người dùng';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserData = useCallback(async (id: number, data: UpdateUserData) => {
    try {
      const updatedUser = await updateUser(id, data);
      setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
      return updatedUser;
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi cập nhật người dùng';
      Alert.alert('Lỗi', errorMessage);
      throw err;
    }
  }, []);

  const deleteUserData = useCallback(async (id: number) => {
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi xóa người dùng';
      Alert.alert('Lỗi', errorMessage);
      throw err;
    }
  }, []);

  const createUserData = useCallback(async (data: CreateUserData) => {
    try {
      const newUser = await createUser(data);
      setUsers(prev => [newUser, ...prev]);
      return newUser;
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi tạo người dùng';
      Alert.alert('Lỗi', errorMessage);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
    updateUser: updateUserData,
    deleteUser: deleteUserData,
    createUser: createUserData,
    refresh: () => fetchUsers(),
  };
};

export const useUser = (id: number) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const userData = await getUserById(id);
      setUser(userData);
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi tải thông tin người dùng';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    refresh: fetchUser,
  };
};