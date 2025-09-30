import { Table, TableGroup, Reservation } from "../../models/index";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import {
  CreateTableDTO,
  UpdateTableDTO,
  CreateTableGroupDTO,
  UpdateTableGroupDTO,
} from "../../types/dtos/table.dto";
import { TableAttributes } from "../../models/table.model";

export const TableService = {
  async list(filters?: Partial<TableAttributes>) {
    return Table.findAll({
      where: filters,
      include: [
        {
          model: TableGroup,
          as: "group",
        },
      ],
      order: [["table_number", "ASC"]],
    });
  },

  async get(id: string) {
    return Table.findByPk(id, {
      include: [
        {
          model: TableGroup,
          as: "group",
        },
        {
          model: Reservation,
          as: "current_reservation",
          where: {
            status: "active",
          },
          required: false,
        },
      ],
    });
  },

  async create(payload: CreateTableDTO) {
    const id = payload.id || uuidv4();
    const table = await Table.create({
      id,
      ...payload,
      status: payload.status || "available",
      created_at: new Date(),
    });
    return this.get(table.id);
  },

  async update(id: string, payload: UpdateTableDTO) {
    const table = await Table.findByPk(id);
    if (!table) return null;

    await table.update({
      ...payload,
      updated_at: new Date(),
    });

    return this.get(id);
  },

  async delete(id: string) {
    const table = await Table.findByPk(id);
    if (!table) return false;
    await table.destroy();
    return true;
  },

  async updateStatus(id: string, status: TableAttributes["status"]) {
    const table = await Table.findByPk(id);
    if (!table) return null;

    await table.update({
      status,
      updated_at: new Date(),
    });

    return this.get(id);
  },

  async assignToGroup(id: string, groupId: string) {
    const table = await Table.findByPk(id);
    if (!table) return null;

    await table.update({
      group_id: groupId,
      updated_at: new Date(),
    });

    return this.get(id);
  },

  async findAvailable(capacity: number, datetime: Date) {
    return Table.findAll({
      where: {
        capacity: { [Op.gte]: capacity },
        status: "available",
      },
      include: [
        {
          model: Reservation,
          where: {
            reservation_time: {
              [Op.not]: datetime,
            },
            status: "active",
          },
          required: false,
        },
      ],
    });
  },

  async getTableGroups() {
    return TableGroup.findAll({
      include: [
        {
          model: Table,
          as: "tables",
        },
      ],
    });
  },

  async createTableGroup(payload: CreateTableGroupDTO) {
    const id = payload.id || uuidv4();
    const group = await TableGroup.create({
      id,
      ...payload,
      created_at: new Date(),
    });

    if (payload.table_ids) {
      await Table.update(
        { group_id: group.id },
        { where: { id: { [Op.in]: payload.table_ids } } }
      );
    }

    return TableGroup.findByPk(group.id, {
      include: [
        {
          model: Table,
          as: "tables",
        },
      ],
    });
  },

  async updateTableGroup(id: string, payload: UpdateTableGroupDTO) {
    const group = await TableGroup.findByPk(id);
    if (!group) return null;

    await group.update({
      ...payload,
      updated_at: new Date(),
    });

    if (payload.table_ids) {
      // Remove all existing tables from group
      await Table.update({ group_id: null }, { where: { group_id: id } });

      // Assign new tables to group
      await Table.update(
        { group_id: id },
        { where: { id: { [Op.in]: payload.table_ids } } }
      );
    }

    return TableGroup.findByPk(id, {
      include: [
        {
          model: Table,
          as: "tables",
        },
      ],
    });
  },

  async deleteTableGroup(id: string) {
    const group = await TableGroup.findByPk(id);
    if (!group) return false;

    // Remove group reference from tables
    await Table.update({ group_id: null }, { where: { group_id: id } });

    await group.destroy();
    return true;
  },
};
