import { Supplier } from "../../models/index";
import { v4 as uuidv4 } from "uuid";
import {
  CreateSupplierDTO,
  UpdateSupplierDTO,
} from "../../types/dtos/supplier.dto";

export const SupplierService = {
  async list() {
    return Supplier.findAll({
      order: [["name", "ASC"]],
      include: ["ingredients", "inventory_imports"],
    });
  },

  async get(id: string) {
    return Supplier.findByPk(id, {
      include: ["ingredients", "inventory_imports"],
    });
  },

  async create(payload: CreateSupplierDTO) {
    const id = payload.id || uuidv4();
    const supplier = await Supplier.create({
      id,
      ...payload,
      active: payload.active ?? true,
      created_at: new Date(),
    });
    return this.get(supplier.id);
  },

  async update(id: string, payload: UpdateSupplierDTO) {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) return null;

    await supplier.update({
      ...payload,
      updated_at: new Date(),
    });
    return this.get(id);
  },

  async remove(id: string) {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) return false;

    // Soft delete by setting active to false
    await supplier.update({
      active: false,
      updated_at: new Date(),
    });
    return true;
  },

  async getActiveSuppliers() {
    return Supplier.findAll({
      where: { active: true },
      order: [["name", "ASC"]],
      include: ["ingredients"],
    });
  },

  async searchByName(query: string) {
    return Supplier.findAll({
      where: {
        name: {
          [Op.like]: `%${query}%`,
        },
      },
      include: ["ingredients"],
    });
  },

  async updateRating(id: string, rating: number) {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) return null;

    await supplier.update({
      rating,
      updated_at: new Date(),
    });
    return this.get(id);
  },
};
