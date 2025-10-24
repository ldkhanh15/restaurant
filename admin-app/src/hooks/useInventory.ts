import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

// Mock interface for inventory items since API might not have these endpoints yet
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  cost_per_unit: number;
  supplier: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  last_updated: string;
  expiry_date?: string;
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
  category: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  cost_per_unit: number;
  supplier: string;
}

// Mock data for demonstration
const mockInventoryItems: InventoryItem[] = [
  {
    id: '1',
    name: "Thịt bò",
    category: "Thịt",
    unit: "kg",
    current_stock: 25,
    min_stock: 10,
    max_stock: 100,
    cost_per_unit: 350000,
    supplier: "Công ty TNHH Thực phẩm ABC",
    status: "in_stock",
    last_updated: "2024-03-20T10:00:00.000Z",
    expiry_date: "2024-03-25"
  },
  {
    id: '2',
    name: "Bánh phở",
    category: "Nguyên liệu",
    unit: "kg",
    current_stock: 5,
    min_stock: 15,
    max_stock: 50,
    cost_per_unit: 25000,
    supplier: "Nhà máy bánh phở Hương Việt",
    status: "low_stock",
    last_updated: "2024-03-19T15:30:00.000Z",
    expiry_date: "2024-03-30"
  },
  {
    id: '3',
    name: "Hành lá",
    category: "Rau củ",
    unit: "kg",
    current_stock: 0,
    min_stock: 5,
    max_stock: 20,
    cost_per_unit: 15000,
    supplier: "Vườn rau sạch Đà Lạt",
    status: "out_of_stock",
    last_updated: "2024-03-18T08:00:00.000Z"
  }
];

const mockImportHistory: ImportHistory[] = [
  {
    id: '1',
    supplier: "Công ty TNHH Thực phẩm ABC",
    items: [
      {
        item_id: '1',
        item_name: "Thịt bò",
        quantity: 20,
        cost_per_unit: 350000,
        total_cost: 7000000
      }
    ],
    total_cost: 7000000,
    import_date: "2024-03-20T10:00:00.000Z",
    created_by: "Nhân viên Minh",
    status: "completed"
  },
  {
    id: '2',
    supplier: "Vườn rau sạch Đà Lạt",
    items: [
      {
        item_id: '3',
        item_name: "Hành lá",
        quantity: 10,
        cost_per_unit: 15000,
        total_cost: 150000
      }
    ],
    total_cost: 150000,
    import_date: "2024-03-19T14:00:00.000Z",
    created_by: "Nhân viên Lan",
    status: "completed"
  }
];

export const useInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>(mockInventoryItems);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>(mockImportHistory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventoryItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 Hook: Fetching inventory items...');
      // TODO: Replace with actual API call when available
      // const response = await restaurantApi.inventory.inventoryList();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setItems(mockInventoryItems);
      console.log('✅ Hook: Inventory items loaded successfully:', mockInventoryItems.length);
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
      
      console.log('📦 Hook: Fetching import history...');
      // TODO: Replace with actual API call when available
      // const response = await restaurantApi.inventory.importHistoryList();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setImportHistory(mockImportHistory);
      console.log('✅ Hook: Import history loaded successfully:', mockImportHistory.length);
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
      // TODO: Replace with actual API call when available
      // const response = await restaurantApi.inventory.inventoryCreate(data);
      
      const newItem: InventoryItem = {
        id: Date.now().toString(),
        name: data.name,
        category: data.category,
        unit: data.unit,
        current_stock: data.current_stock,
        min_stock: data.min_stock,
        max_stock: data.max_stock,
        cost_per_unit: data.cost_per_unit,
        supplier: data.supplier,
        status: data.current_stock === 0 ? 'out_of_stock' : 
                data.current_stock <= data.min_stock ? 'low_stock' : 'in_stock',
        last_updated: new Date().toISOString()
      };
      
      setItems(prev => [newItem, ...prev]);
      Alert.alert('Thành công', 'Tạo mặt hàng thành công!');
      console.log('✅ Hook: Inventory item created successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi tạo mặt hàng';
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
      // TODO: Replace with actual API call when available
      // const response = await restaurantApi.inventory.inventoryUpdate(id, data);
      
      setItems(prev => prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...data, last_updated: new Date().toISOString() };
          // Update status based on stock level
          if (updated.current_stock === 0) {
            updated.status = 'out_of_stock';
          } else if (updated.current_stock <= updated.min_stock) {
            updated.status = 'low_stock';
          } else {
            updated.status = 'in_stock';
          }
          return updated;
        }
        return item;
      }));
      
      Alert.alert('Thành công', 'Cập nhật mặt hàng thành công!');
      console.log('✅ Hook: Inventory item updated successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi cập nhật mặt hàng';
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
      // TODO: Replace with actual API call when available
      // const response = await restaurantApi.inventory.inventoryDelete(id);
      
      setItems(prev => prev.filter(item => item.id !== id));
      Alert.alert('Thành công', 'Xóa mặt hàng thành công!');
      console.log('✅ Hook: Inventory item deleted successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi xóa mặt hàng';
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

export type { InventoryItem, ImportHistory, CreateInventoryData };