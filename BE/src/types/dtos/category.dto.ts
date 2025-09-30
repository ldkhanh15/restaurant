import { CategoryDishAttributes } from "../../models/categoryDish.model";

export interface CreateCategoryDTO {
  name: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  is_active?: boolean;
  display_order?: number;
  metadata?: {
    icon?: string;
    color?: string;
    tags?: string[];
    availability?: {
      days?: string[];
      start_time?: string;
      end_time?: string;
    };
  };
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> {}

export interface CategoryDishAssignmentDTO {
  category_id: string;
  dish_ids: string[];
}

export interface MenuSectionDTO {
  id: string;
  name: string;
  description?: string;
  categories: CategoryDishAttributes[];
  display_order: number;
  is_active: boolean;
  availability?: {
    days: string[];
    start_time: string;
    end_time: string;
  };
}

export interface CreateMenuSectionDTO extends Omit<MenuSectionDTO, "id"> {}

export interface UpdateMenuSectionDTO extends Partial<CreateMenuSectionDTO> {}
