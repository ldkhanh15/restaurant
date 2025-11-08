import { BaseService } from "./baseService"
import Table from "../models/Table"
import { Op, Sequelize } from "sequelize"

class TableService extends BaseService<Table> {
  constructor() {
    super(Table)
  }

  async findTablesByStatus(status:string, options?: any) {
    return await this.findAll({
      ...options,
      where: { 
        status: status,
      },
    })
  }

  async search(params: any) {
    const where: any = {}

    // --- Search/table_number contains (case-insensitive, MySQL-safe) ---
    if (params.search || params.table_number) {
      const searchValue = (params.search || params.table_number).trim().toLowerCase();
      where[Op.and] = Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('Table.table_number')),
        { [Op.like]: `%${searchValue}%` }
      );
    }

    // --- Status filter ---
    if (params.status) {
      where.status = params.status
    }

    // --- Capacity filtering ---
    if (params.capacity_ranges) {
      const ranges = params.capacity_ranges.split(",").map((r: string) => {
        const [min, max] = r.split("-").map(Number);
        return {
          capacity: {
            [Op.gte]: Number(min),
            ...(max !== undefined ? { [Op.lt]: Number(max) } : {})
          }
        };
      });
      where[Op.or] = ranges;
    } else {
      if (params.capacity_exact) {
        where.capacity = +params.capacity_exact;
      } else {
        if (params.capacity_min || params.capacity_max) {
          where.capacity = {}
          if (params.capacity_min) where.capacity[Op.gte] = +params.capacity_min
          if (params.capacity_max) where.capacity[Op.lt] = +params.capacity_max
        }
      }
    }

    // --- Deposit filtering ---
    if (params.deposit_ranges) {
      const ranges = params.deposit_ranges.split(",").map((r: string) => {
        const [min, max] = r.split("-").map(Number);
        return {
          deposit: {
            [Op.gte]: Number(min),
            ...(max !== undefined ? { [Op.lt]: Number(max) } : {})
          }
        };
      });
      where[Op.or] = ranges;
    } else {
      if (params.deposit_exact) {
        where.deposit = +params.deposit_exact;
      } else {
        if (params.deposit_min || params.deposit_max) {
          where.deposit = {}
          if (params.deposit_min) where.deposit[Op.gte] = +params.deposit_min
          if (params.deposit_max) where.deposit[Op.lt] = +params.deposit_max
        }
      }
    }

    // --- Cancel minutes filtering ---
    if (params.cancel_minutes_min || params.cancel_minutes_max) {
      where.cancel_minutes = {}
      if (params.cancel_minutes_min) where.cancel_minutes[Op.gte] = +params.cancel_minutes_min
      if (params.cancel_minutes_max) where.cancel_minutes[Op.lt] = +params.cancel_minutes_max
    }

    // --- Pagination ---
    const page = params.page ? +params.page : 1;
    const limit = params.limit ? +params.limit : 10;
    const offset = (page - 1) * limit;

    // --- Sorting (FE-friendly + backward compatible) ---
    let sortBy = "created_at";
    let sortOrder: "ASC" | "DESC" = "ASC";

    if (params.sort) {
      switch (params.sort) {
        case "capacity_asc":
          sortBy = "capacity";
          sortOrder = "ASC";
          break;
        case "capacity_desc":
          sortBy = "capacity";
          sortOrder = "DESC";
          break;
        case "table_number":
          sortBy = "table_number";
          sortOrder = "ASC";
          break;
        default:
          if (params.sort.startsWith("-")) {
            sortBy = params.sort.substring(1);
            sortOrder = "DESC";
          } else {
            sortBy = params.sort;
            sortOrder = "ASC";
          }
      }
    } else if (params.sortBy) {
      sortBy = params.sortBy;
      sortOrder = (params.sortOrder || "ASC").toUpperCase() as "ASC" | "DESC";
    }

    // --- Query to DB ---
    const { count, rows } = await this.model.findAndCountAll({
      where,
      distinct: true,
      limit,
      offset,
      order: sortBy === "table_number"
        ? [[Sequelize.fn('LOWER', Sequelize.col('Table.table_number')), sortOrder]]
        : [[sortBy, sortOrder]],
    });

    // --- Convert numeric fields to number ---
    const formattedRows = rows.map((r: any) => ({
      ...r.get({ plain: true }),
      capacity: Number(r.capacity),
      deposit: Number(r.deposit),
      cancel_minutes: Number(r.cancel_minutes)
    }));

    return { count, rows: formattedRows, page, limit };
  }
}

export default new TableService()
