import { CategoryDish, Dish } from "../../models/index";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import {
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryDishAssignmentDTO,
  MenuSectionDTO,
} from "../../types/dtos/category.dto";

export const CategoryDishService = {
  async list() {
    return CategoryDish.findAll({
      include: ["dishes"],
      order: [
        ["display_order", "ASC"],
        ["name", "ASC"],
      ],
    });
  },

  async get(id: string) {
    return CategoryDish.findByPk(id, {
      include: ["dishes"],
    });
  },

  async create(payload: CreateCategoryDTO) {
    const id = payload.id || uuidv4();
    const category = await CategoryDish.create({
      id,
      ...payload,
      is_active: payload.is_active ?? true,
      created_at: new Date(),
    });
    return this.get(category.id);
  },

  async update(id: string, payload: UpdateCategoryDTO) {
    const category = await CategoryDish.findByPk(id);
    if (!category) return null;

    await category.update({
      ...payload,
      updated_at: new Date(),
    });
    return this.get(id);
  },

  async remove(id: string) {
    const category = await CategoryDish.findByPk(id);
    if (!category) return false;

    // Remove dish associations first
    await category.removeDishes();
    await category.destroy();
    return true;
  },

  async assignDishes(payload: CategoryDishAssignmentDTO) {
    const category = await CategoryDish.findByPk(payload.category_id);
    if (!category) throw new Error("Category not found");

    await category.setDishes(payload.dish_ids);
    return this.get(category.id);
  },

  async getMenuSections(): Promise<MenuSectionDTO[]> {
    const categories = await CategoryDish.findAll({
      where: { is_active: true },
      include: ["dishes"],
      order: [
        ["display_order", "ASC"],
        ["name", "ASC"],
      ],
    });

    // Group categories by their availability
    const sections: { [key: string]: MenuSectionDTO } = {};

    categories.forEach((category) => {
      const availability = category.metadata?.availability;
      const key = availability
        ? `${availability.days?.join(",")}_${availability.start_time}_${
            availability.end_time
          }`
        : "always";

      if (!sections[key]) {
        sections[key] = {
          id: uuidv4(),
          name: availability
            ? `${availability.start_time} - ${availability.end_time}`
            : "All Day",
          categories: [],
          display_order: availability ? 1 : 0,
          is_active: true,
          availability: availability || {
            days: [
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ],
            start_time: "00:00",
            end_time: "23:59",
          },
        };
      }

      sections[key].categories.push(category);
    });

    return Object.values(sections).sort(
      (a, b) => a.display_order - b.display_order
    );
  },

  async searchByName(query: string) {
    return CategoryDish.findAll({
      where: {
        name: {
          [Op.like]: `%${query}%`,
        },
        is_active: true,
      },
      include: ["dishes"],
    });
  },

  async reorderCategories(orderedIds: string[]) {
    for (let i = 0; i < orderedIds.length; i++) {
      await CategoryDish.update(
        { display_order: i },
        { where: { id: orderedIds[i] } }
      );
    }
    return this.list();
  },
};
