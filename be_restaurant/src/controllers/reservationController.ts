import type { Request, Response, NextFunction } from "express"
import reservationService from "../services/reservationService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"
import Reservation from "../models/Reservation"
import { AppError } from "../middlewares/errorHandler"
import Order from "../models/Order"
import OrderItem from "../models/OrderItem"
import Dish from "../models/Dish"
import sequelize from "../config/database"
import Table from "../models/Table"

export const getAllReservations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)
    const offset = (page - 1) * limit

    const { rows, count } = await reservationService.findAllWithDetails({
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    })

    const result = buildPaginationResult(rows, count, page, limit)
    res.json({ status: "success", data: result })
  } catch (error) {
    next(error)
  }
}

export const getReservationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservation = await reservationService.findById(req.params.id)
    res.json({ status: "success", data: reservation })
  } catch (error) {
    next(error)
  }
}

export const createReservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservation = await reservationService.create(req.body)
    res.status(201).json({ status: "success", data: reservation })
  } catch (error) {
    next(error)
  }
}

export const updateReservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservation = await reservationService.update(req.params.id, req.body)
    res.json({ status: "success", data: reservation })
  } catch (error) {
    next(error)
  }
}
export const confirmReservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservation = await reservationService.update(req.params.id, { status: "confirmed" })
    res.json({ status: "success", data: reservation })
  } catch (error) {
    next(error)
  }
}
export const deleteReservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await reservationService.delete(req.params.id)
    res.json({ status: "success", message: "Reservation deleted successfully" })
  } catch (error) {
    next(error)
  }
}

export const setReservationEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const { event_id, event_fee } = req.body as { event_id?: string; event_fee?: number }
    const reservation = await Reservation.findByPk(id)
    if (!reservation) throw new AppError("Reservation not found", 404)
    await reservation.update({ event_id: event_id || null as any, event_fee: Number(event_fee || 0) })
    res.json({ status: "success", data: reservation })
  } catch (error) {
    next(error)
  }
}

// Create or reuse pending order from reservation and optionally attach items
export const createOrderFromReservation = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  try {
    const id = req.params.id
    const reservation = await Reservation.findByPk(id, { transaction })
    if (!reservation) throw new AppError("Reservation not found", 404)

    // Find existing pending order by reservation
    let order = await Order.findOne({ where: { reservation_id: id }, transaction })
    if (!order) {
      order = await Order.create(
        {
          reservation_id: reservation.id,
          user_id: reservation.user_id,
          table_id: reservation.table_id,
          status: "pending",
          total_amount: 0,
          voucher_discount_amount: 0,
          event_id: reservation.event_id,
          event_fee: Number(reservation.event_fee || 0),
          deposit_amount: Number(reservation.deposit_amount || 0),
          final_amount: 0,
        },
        { transaction },
      )
    }

    // Optionally accept items in body to add immediately
    const { items } = req.body as { items?: Array<{ dish_id: string; quantity: number }> }
    if (items && items.length > 0) {
      for (const it of items) {
        const dish = await Dish.findByPk(it.dish_id)
        if (!dish || !dish.active) throw new AppError("Dish not available", 400)
        const existing = await OrderItem.findOne({ where: { order_id: order.id, dish_id: it.dish_id }, transaction })
        if (existing) {
          await existing.update({ quantity: Number(existing.quantity) + Number(it.quantity) }, { transaction })
        } else {
          await OrderItem.create(
            { order_id: order.id, dish_id: it.dish_id, quantity: it.quantity, price: dish.price },
            { transaction },
          )
        }
      }
    }

    // Recompute totals
    const orderItems = await OrderItem.findAll({ where: { order_id: order.id }, transaction })
    const subtotal = orderItems.reduce((sum, x) => sum + Number(x.price) * Number(x.quantity), 0)
    const total_amount = Number(subtotal.toFixed(2))
    const final_amount = Number((subtotal + Number(order.event_fee || 0) - Number(order.deposit_amount || 0) - Number(order.voucher_discount_amount || 0)).toFixed(2))
    await order.update({ total_amount, final_amount }, { transaction })

    await transaction.commit()
    const reloaded = await Order.findByPk(order.id, { include: [{ model: OrderItem, as: "items" }] })
    res.status(201).json({ status: "success", data: reloaded })
  } catch (error) {
    await transaction.rollback()
    next(error)
  }
}

// Add items against reservation (auto-create pending order if needed)
export const addItemToReservationOrder = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  try {
    const id = req.params.id
    const { dish_id, quantity } = req.body as { dish_id: string; quantity: number }
    const reservation = await Reservation.findByPk(id, { transaction })
    if (!reservation) throw new AppError("Reservation not found", 404)

    let order = await Order.findOne({ where: { reservation_id: id }, transaction })
    if (!order) {
      order = await Order.create(
        {
          reservation_id: reservation.id,
          user_id: reservation.user_id,
          table_id: reservation.table_id,
          status: "pending",
          total_amount: 0,
          voucher_discount_amount: 0,
          event_id: reservation.event_id,
          event_fee: Number(reservation.event_fee || 0),
          deposit_amount: Number(reservation.deposit_amount || 0),
          final_amount: 0,
        },
        { transaction },
      )
    }

    const dish = await Dish.findByPk(dish_id)
    if (!dish || !dish.active) throw new AppError("Dish not available", 400)

    const existing = await OrderItem.findOne({ where: { order_id: order.id, dish_id }, transaction })
    if (existing) {
      await existing.update({ quantity: Number(existing.quantity) + Number(quantity) }, { transaction })
    } else {
      await OrderItem.create({ order_id: order.id, dish_id, quantity, price: dish.price }, { transaction })
    }

    // Recompute totals
    const orderItems = await OrderItem.findAll({ where: { order_id: order.id }, transaction })
    const subtotal = orderItems.reduce((sum, x) => sum + Number(x.price) * Number(x.quantity), 0)
    const total_amount = Number(subtotal.toFixed(2))
    const final_amount = Number((subtotal + Number(order.event_fee || 0) - Number(order.deposit_amount || 0) - Number(order.voucher_discount_amount || 0)).toFixed(2))
    await order.update({ total_amount, final_amount }, { transaction })

    await transaction.commit()
    const reloaded = await Order.findByPk(order.id, { include: [{ model: OrderItem, as: "items" }] })
    res.json({ status: "success", data: reloaded })
  } catch (error) {
    await transaction.rollback()
    next(error)
  }
}

// Check-in reservation: set order to dining and occupy table
export const checkinReservation = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  try {
    const id = req.params.id
    const reservation = await Reservation.findByPk(id, { transaction })
    if (!reservation) throw new AppError("Reservation not found", 404)

    let order = await Order.findOne({ where: { reservation_id: id }, transaction })
    if (!order) {
      order = await Order.create(
        {
          reservation_id: reservation.id,
          user_id: reservation.user_id,
          table_id: reservation.table_id,
          status: "dining",
          total_amount: 0,
          voucher_discount_amount: 0,
          event_id: reservation.event_id,
          event_fee: Number(reservation.event_fee || 0),
          deposit_amount: Number(reservation.deposit_amount || 0),
          final_amount: 0,
        },
        { transaction },
      )
    } else {
      await order.update({ status: "dining" }, { transaction })
    }

    if (reservation.table_id) {
      const table = await Table.findByPk(reservation.table_id, { transaction })
      if (table) await table.update({ status: "occupied" }, { transaction })
    }

    await transaction.commit()
    const reloaded = await Order.findByPk(order.id, { include: [{ model: OrderItem, as: "items" }] })
    res.json({ status: "success", data: reloaded })
  } catch (error) {
    await transaction.rollback()
    next(error)
  }
}
