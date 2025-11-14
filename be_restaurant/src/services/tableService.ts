import { BaseService } from "./baseService"
import Table from "../models/Table"
import Reservation from "../models/Reservation"
import { Op, Sequelize } from "sequelize"
import sequelize from "../config/database"

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

  /**
   * Get available tables for reservation with filters
   * @param numPeople - Number of people (filter tables by capacity)
   * @param date - Reservation date (optional, for time slot checking)
   * @param durationMinutes - Duration in minutes (default 60)
   */
  async findAvailableTablesForReservation(
    numPeople?: number,
    date?: Date,
    durationMinutes: number = 60
  ) {
    const where: any = {
      status: { [Op.in]: ["available", "reserved"] }, // Can reserve available or reserved tables
    };

    // Filter by capacity if numPeople provided
    if (numPeople && numPeople > 0) {
      where.capacity = { [Op.gte]: numPeople };
    }

    const tables = await this.findAll({
      where,
      order: [["capacity", "ASC"]], // Sort by capacity ascending
    });

    const formattedTables = (tables.rows || tables).map((t: any) => ({
      ...t.get ? t.get({ plain: true }) : t,
      capacity: Number(t.capacity),
      deposit: Number(t.deposit),
      cancel_minutes: Number(t.cancel_minutes),
    }));

    // If date provided, check time slot availability for each table
    if (date) {
      const tablesWithAvailability = await Promise.all(
        formattedTables.map(async (table: any) => {
          const availableTimeSlots = await this.getAvailableTimeSlots(
            table.id,
            date,
            durationMinutes
          );
          return {
            ...table,
            available_time_slots: availableTimeSlots,
          };
        })
      );
      return tablesWithAvailability;
    }

    return formattedTables;
  }

  /**
   * Get available time slots for a table on a specific date
   * @param tableId - Table ID
   * @param date - Date to check (only date part is used)
   * @param durationMinutes - Duration in minutes (default 60)
   * @returns Array of available time slots in format { start: "HH:MM", end: "HH:MM" }
   */
  async getAvailableTimeSlots(
    tableId: string,
    date: Date,
    durationMinutes: number = 60
  ): Promise<Array<{ start: string; end: string }>> {
    // Get start and end of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all existing reservations for this table on this date
    const existingReservations = await Reservation.findAll({
      where: {
        table_id: tableId,
        reservation_time: {
          [Op.between]: [startOfDay, endOfDay],
        },
        status: { [Op.in]: ["pending", "confirmed"] }, // Only active reservations
      },
      order: [["reservation_time", "ASC"]],
    });

    // Generate time slots (every 30 minutes from 8:00 to 22:00)
    const slots: Array<{ start: Date; end: Date }> = [];
    const startHour = 8;
    const endHour = 22;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, minute, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

        // Skip if slot end is after end of day
        if (slotEnd > endOfDay) continue;

        // Skip if slot is in the past
        if (slotStart < new Date()) continue;

        slots.push({ start: slotStart, end: slotEnd });
      }
    }

    // Filter out slots that conflict with existing reservations
    const availableSlots = slots.filter((slot) => {
      return !existingReservations.some((reservation) => {
        const resStart = new Date(reservation.reservation_time);
        const resEnd = new Date(
          resStart.getTime() + reservation.duration_minutes * 60 * 1000
        );

        // Check if slot overlaps with reservation
        // Slot overlaps if: slot.start < resEnd && slot.end > resStart
        return slot.start < resEnd && slot.end > resStart;
      });
    });

    // Format as HH:MM strings
    return availableSlots.map((slot) => ({
      start: `${String(slot.start.getHours()).padStart(2, "0")}:${String(
        slot.start.getMinutes()
      ).padStart(2, "0")}`,
      end: `${String(slot.end.getHours()).padStart(2, "0")}:${String(
        slot.end.getMinutes()
      ).padStart(2, "0")}`,
    }));
  }
}

export default new TableService()
