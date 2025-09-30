import { TableGroup } from "../../models/index";
import { v4 as uuidv4 } from "uuid";
import { getIO } from "../../sockets/io";
import {
  CreateTableGroupDTO,
  UpdateTableGroupDTO,
} from "../../types/dtos/table.dto";

export const TableGroupService = {
  async list() {
    return TableGroup.findAll({
      order: [["group_name", "ASC"]],
      include: ["tables"],
    });
  },

  async get(id: string) {
    return TableGroup.findByPk(id, {
      include: ["tables"],
    });
  },

  async create(payload: CreateTableGroupDTO) {
    const id = payload.id || uuidv4();
    const tableGroup = await TableGroup.create({
      id,
      ...payload,
      created_at: new Date(),
      updated_at: new Date(),
    });

    getIO().emit("table-group-created", tableGroup);
    return this.get(tableGroup.id);
  },

  async update(id: string, payload: UpdateTableGroupDTO) {
    const tableGroup = await TableGroup.findByPk(id);
    if (!tableGroup) return null;

    await tableGroup.update({
      ...payload,
      updated_at: new Date(),
    });

    getIO().emit("table-group-updated", tableGroup);
    return this.get(id);
  },

  async remove(id: string) {
    const tableGroup = await TableGroup.findByPk(id);
    if (!tableGroup) return false;

    await tableGroup.destroy();
    getIO().emit("table-group-deleted", { id });
    return true;
  },
};
