import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dishesAPI, { Dish, CreateDishData, UpdateDishData } from '../api/dishesApi';
import { categoryAPI, Category, CreateCategoryData, UpdateCategoryData } from '../api/categoryApi';

// Type aliases for compatibility
export type MenuItem = Dish;
export type MenuCategory = Category;
export type CreateMenuItemRequest = CreateDishData;
export type UpdateMenuItemRequest = UpdateDishData;
export type CreateCategoryRequest = CreateCategoryData;
export type UpdateCategoryRequest = UpdateCategoryData;

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
    queryFn: () => dishesAPI.getDishes(),
  });
};

export const useMenuCategories = () => {
  return useQuery({
    queryKey: MENU_KEYS.categories(),
    queryFn: () => categoryAPI.getCategories(),
  });
};

export const useMenuItem = (id: string) => {
  return useQuery({
    queryKey: MENU_KEYS.item(id),
    queryFn: () => dishesAPI.getDishById(id),
    enabled: !!id,
  });
};

// Mutations
export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateDishData) => dishesAPI.createDish(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items() });
    },
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDishData }) =>
      dishesAPI.updateDish(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items() });
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.item(id) });
    },
  });
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => dishesAPI.deleteDish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items() });
    },
  });
};

// Category mutations
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCategoryData) => categoryAPI.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.categories() });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryData }) =>
      categoryAPI.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.categories() });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => categoryAPI.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.categories() });
    },
  });
};

export const useToggleCategoryStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      categoryAPI.toggleCategoryStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.categories() });
    },
  });
};
