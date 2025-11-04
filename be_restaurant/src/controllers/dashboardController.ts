import type { Request, Response, NextFunction } from "express"
import sequelize from "../config/database"
import { QueryTypes } from "sequelize"
import Order from "../models/Order"
import OrderItem from "../models/OrderItem"
import User from "../models/User"
import Dish from "../models/Dish"
import Table from "../models/Table"
import Reservation from "../models/Reservation"
import { Op } from "sequelize"

// Thống kê tổng quan
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfYear = new Date(today.getFullYear(), 0, 1)

    // Tổng số khách hàng
    const totalCustomers = await User.count({
      where: { role: 'customer' }
    })

    // Đơn hàng hôm nay
    const todayOrders = await Order.count({
      where: {
        created_at: {
          [Op.gte]: startOfDay
        }
      }
    })

    // Doanh thu tháng này
    const monthlyRevenue = await Order.sum('total_amount', {
      where: {
        created_at: {
          [Op.gte]: startOfMonth
        },
        status: 'paid'
      }
    }) || 0

    // Đặt bàn hôm nay
    const todayReservations = await Reservation.count({
      where: {
        reservation_time: {
          [Op.gte]: startOfDay,
          [Op.lt]: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    })

    // Tổng số món ăn
    const totalDishes = await Dish.count({
      where: { active: true }
    })

    // % tăng trưởng (mock data cho demo)
    const growthRate = 23

    res.json({
      status: "success",
      data: {
        totalCustomers,
        todayOrders,
        monthlyRevenue,
        todayReservations,
        totalDishes,
        growthRate
      }
    })
  } catch (error) {
    next(error)
  }
}

// Thống kê doanh thu theo tháng
export const getRevenueStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear()
    
    const revenueByMonth = await sequelize.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        SUM(total_amount) as revenue
      FROM orders 
      WHERE YEAR(created_at) = :year 
        AND status = 'completed'
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month
    `, {
      replacements: { year },
      type: QueryTypes.SELECT
    }) as any[]

    // Format để phù hợp với frontend
    const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
    const formattedData = []
    
    for (let i = 1; i <= 12; i++) {
      const monthStr = `${year}-${i.toString().padStart(2, '0')}`
      const found = revenueByMonth.find(item => item.month === monthStr)
      formattedData.push({
        month: monthNames[i - 1],
        revenue: found ? parseFloat(found.revenue) : 0
      })
    }

    res.json({
      status: "success",
      data: formattedData
    })
  } catch (error) {
    next(error)
  }
}

// Thống kê đơn hàng theo giờ
export const getDailyOrdersStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = req.query.date ? new Date(req.query.date as string) : new Date()
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

    const ordersByHour = await sequelize.query(`
      SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as orders
      FROM orders 
      WHERE created_at >= :startOfDay 
        AND created_at < :endOfDay
      GROUP BY HOUR(created_at)
      ORDER BY hour
    `, {
      replacements: { startOfDay, endOfDay },
      type: QueryTypes.SELECT
    }) as any[]

    // Format để hiển thị 24h
    const formattedData = []
    for (let i = 6; i <= 23; i += 2) { // Từ 6h đến 23h, mỗi 2 tiếng
      const found = ordersByHour.find(item => item.hour === i)
      formattedData.push({
        time: `${i}h`,
        orders: found ? parseInt(found.orders) : 0
      })
    }

    res.json({
      status: "success",
      data: formattedData
    })
  } catch (error) {
    next(error)
  }
}

// Món ăn phổ biến
export const getPopularDishes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5
    
    const popularDishes = await sequelize.query(`
      SELECT 
        d.name,
        SUM(oi.quantity) as orders,
        SUM(oi.quantity * oi.price) as revenue
      FROM order_items oi
      JOIN dishes d ON oi.dish_id = d.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'paid'
        AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY d.id, d.name
      ORDER BY orders DESC
      LIMIT :limit
    `, {
      replacements: { limit },
      type: QueryTypes.SELECT
    }) as any[]

    const formattedData = popularDishes.map(dish => ({
      name: dish.name,
      orders: parseInt(dish.orders),
      revenue: parseFloat(dish.revenue)
    }))

    res.json({
      status: "success",
      data: formattedData
    })
  } catch (error) {
    next(error)
  }
}

// Đơn hàng gần đây
export const getRecentOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5
    
    const recentOrders = await Order.findAll({
      limit,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['full_name', 'email']
        }
      ],
      attributes: ['id', 'total_amount', 'status', 'created_at']
    })

    const formattedData = recentOrders.map(order => ({
      id: `#${order.id.slice(-4)}`,
      customer: (order as any).user?.full_name || 'Khách lẻ',
      amount: Number(order.total_amount),
      status: getOrderStatusInVietnamese(order.status),
      time: order.created_at ? new Date(order.created_at).toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : ''
    }))

    res.json({
      status: "success",
      data: formattedData
    })
  } catch (error) {
    next(error)
  }
}

// Thống kê theo giờ trong ngày (doanh thu)
export const getHourlyRevenueStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = req.query.date ? new Date(req.query.date as string) : new Date()
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

    const revenueByHour = await sequelize.query(`
      SELECT 
        HOUR(created_at) as hour,
        SUM(total_amount) as revenue
      FROM orders 
      WHERE created_at >= :startOfDay 
        AND created_at < :endOfDay
        AND status = 'paid'
      GROUP BY HOUR(created_at)
      ORDER BY hour
    `, {
      replacements: { startOfDay, endOfDay },
      type: QueryTypes.SELECT
    }) as any[]

    // Format cho chart
    const formattedData = []
    for (let i = 6; i <= 22; i += 2) { // Từ 6h đến 22h
      const found = revenueByHour.find(item => item.hour === i)
      formattedData.push({
        time: `${i}h`,
        revenue: found ? parseFloat(found.revenue) / 1000000 : 0 // Convert to millions
      })
    }

    res.json({
      status: "success",
      data: formattedData
    })
  } catch (error) {
    next(error)
  }
}

// Helper function
function getOrderStatusInVietnamese(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Chờ xác nhận',
    'dining': 'Đang dùng bữa',
    'waiting_payment': 'Chờ thanh toán',
    'preparing': 'Đang chế biến',
    'ready': 'Sẵn sàng',
    'delivered': 'Đã giao',
    'paid': 'Đã thanh toán',
    'cancelled': 'Đã hủy'
  }
  return statusMap[status] || status
}