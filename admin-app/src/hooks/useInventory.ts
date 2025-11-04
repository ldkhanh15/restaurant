import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import ingredientAPI, { Ingredient } from '../api/ingredientApi';

// Map Ingredient to InventoryItem format for compatibility
interface InventoryItem extends Ingredient {
  category?: string;
  cost_per_unit?: number;
  supplier?: string;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  last_updated?: string;
  expiry_date?: string;
  max_stock_level?: number;
}

interface ImportHistory {
  id: string;
  supplier: string;
  items: Array<{
    item_id: string;
    item_name: string;
    quantity: number;
    cost_per_unit: number;
    total_cost: number;
  }>;
  total_cost: number;
  import_date: string;
  created_by: string;
  status: 'completed' | 'pending' | 'cancelled';
}

interface CreateInventoryData {
  name: string;
  unit: string;
  current_stock: number;
  min_stock_level: number;
  barcode?: string;
  rfid?: string;
}

export const useInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventoryItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 Hook: Fetching inventory items from API...');
      
      const response: any = await ingredientAPI.getAllNoPaging();
      
      // Handle response - unwrapped by interceptor
      const inventoryData = Array.isArray(response) ? response : (response?.data || []);
      
      // Map to InventoryItem format with status calculation
      const mappedItems: InventoryItem[] = inventoryData.map((item: Ingredient) => ({
        ...item,
        status: item.current_stock === 0 
          ? 'out_of_stock' 
          : item.current_stock < item.min_stock_level 
          ? 'low_stock' 
          : 'in_stock',
        last_updated: item.updated_at || item.created_at,
        max_stock_level: item.min_stock_level * 10 // Default max is 10x min
      }));
      
      setItems(mappedItems);
      console.log('✅ Hook: Inventory items loaded successfully:', mappedItems.length);
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi tải danh sách tồn kho';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error fetching inventory items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchImportHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 Hook: Import history not yet implemented in API');
      // TODO: Implement when backend has import history endpoint
      setImportHistory([]);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi tải lịch sử nhập hàng';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error fetching import history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createInventoryItem = useCallback(async (data: CreateInventoryData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 Hook: Creating inventory item:', data);
      
      const newItem: any = await ingredientAPI.create({
        name: data.name,
        unit: data.unit,
        current_stock: data.current_stock,
        min_stock_level: data.min_stock_level,
        barcode: data.barcode,
        rfid: data.rfid
      });
      
      const mappedItem: InventoryItem = {
        ...newItem,
        status: newItem.current_stock === 0 
          ? 'out_of_stock' 
          : newItem.current_stock < newItem.min_stock_level 
          ? 'low_stock' 
          : 'in_stock',
        last_updated: new Date().toISOString()
      };
      
      setItems(prev => [mappedItem, ...prev]);
      Alert.alert('Thành công', 'Thêm nguyên liệu thành công!');
      console.log('✅ Hook: Inventory item created successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi thêm nguyên liệu';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error creating inventory item:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateInventoryItem = useCallback(async (id: string, data: Partial<CreateInventoryData>) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 Hook: Updating inventory item:', id, data);
      
      await ingredientAPI.update(id, data);
      
      setItems(prev => prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...data, last_updated: new Date().toISOString() };
          // Update status based on stock level
          if (updated.current_stock === 0) {
            updated.status = 'out_of_stock';
          } else if (updated.current_stock && updated.min_stock_level && updated.current_stock <= updated.min_stock_level) {
            updated.status = 'low_stock';
          } else {
            updated.status = 'in_stock';
          }
          return updated;
        }
        return item;
      }));
      
      Alert.alert('Thành công', 'Cập nhật nguyên liệu thành công!');
      console.log('✅ Hook: Inventory item updated successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi cập nhật nguyên liệu';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error updating inventory item:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteInventoryItem = useCallback(async (id: string) => {
    try {
      setLoading(true);
      
      console.log('📦 Hook: Deleting inventory item:', id);
      
      await ingredientAPI.remove(id);
      
      setItems(prev => prev.filter(item => item.id !== id));
      Alert.alert('Thành công', 'Xóa nguyên liệu thành công!');
      console.log('✅ Hook: Inventory item deleted successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi xóa nguyên liệu';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error deleting inventory item:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchInventoryItems();
    fetchImportHistory();
  }, [fetchInventoryItems, fetchImportHistory]);

  return {
    items,
    importHistory,
    loading,
    error,
    fetchInventoryItems,
    fetchImportHistory,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    refresh
  };
};