import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMenuItems,
  getMenuCategories,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  MenuItem,
  MenuCategory,
  CreateMenuItemRequest,
  UpdateMenuItemRequest,
} from '../api/menu';

// Query keys
const MENU_KEYS = {
  all: ['menu'] as const,
  items: () => [...MENU_KEYS.all, 'items'] as const,
  categories: () => [...MENU_KEYS.all, 'categories'] as const,
  item: (id: string) => [...MENU_KEYS.all, 'item', id] as const,
};

// Hooks for menu items
export const useMenuItems = () => {
  return useQuery({
    queryKey: MENU_KEYS.items(),
    queryFn: getMenuItems,
  });
};

export const useMenuCategories = () => {
  return useQuery({
    queryKey: MENU_KEYS.categories(),
    queryFn: getMenuCategories,
  });
};

export const useMenuItem = (id: string) => {
  return useQuery({
    queryKey: MENU_KEYS.item(id),
    queryFn: () => getMenuItemById(id),
    enabled: !!id,
  });
};

// Mutations
export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items() });
    },
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuItemRequest }) =>
      updateMenuItem(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items() });
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.item(id) });
    },
  });
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items() });
    },
  });
};