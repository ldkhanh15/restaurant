import { Request, Response, NextFunction } from "express"
import UserBehaviorLog from "../models/UserBehaviorLog"
import Dish from "../models/Dish"
import sequelize from "../config/database"

/**
 * @desc    Log user behavior
 * @route   POST /api/user-behavior
 * @access  Private
 */
export const logUserBehavior = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id, item_id, action_type, search_query } = req.body
    console.log("Logging user behavior:", req.body)
    // Validate action type
    const validActionTypes = ["VIEW", "CLICK", "ORDER", "CANCEL", "SEARCH"]
    if (action_type && !validActionTypes.includes(action_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid action_type. Must be one of: ${validActionTypes.join(", ")}`,
      })
    }

    // For SEARCH action, search_query is required
    if (action_type === "SEARCH" && !search_query) {
      return res.status(400).json({
        success: false,
        message: "search_query is required for SEARCH action",
      })
    }

    // For non-SEARCH actions, item_id is required
    if (action_type !== "SEARCH" && !item_id) {
      return res.status(400).json({
        success: false,
        message: "item_id is required for non-SEARCH actions",
      })
    }

    const userBehavior = await UserBehaviorLog.create({
      user_id,
      item_id,
      action_type,
      search_query,
    })

    res.status(201).json({
      success: true,
      data: userBehavior,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Get recommended dishes for a user based on behavior
 * @route   GET /api/dishes/recommended
 * @access  Private
 */
export const getRecommendedDishes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.query
    
    console.log("Getting recommended dishes for user_id:", user_id)
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      })
    }

    // 1. Calculate behavior scores
    // Get all behavior logs for the user
    const behaviorLogs = await UserBehaviorLog.findAll({
      where: {
        user_id: user_id.toString(),
        action_type: ["VIEW", "CLICK", "ORDER", "CANCEL"],
      },
    })

    // Initialize score map
    const scoreMap: { [key: string]: number } = {}

    // Calculate scores based on action types
    behaviorLogs.forEach((log) => {
      if (!log.item_id) return

      if (!scoreMap[log.item_id]) {
        scoreMap[log.item_id] = 0
      }

      switch (log.action_type) {
        case "ORDER":
          scoreMap[log.item_id] += 10
          break
        case "CLICK":
          scoreMap[log.item_id] += 3
          break
        case "VIEW":
          scoreMap[log.item_id] += 1
          break
        case "CANCEL":
          scoreMap[log.item_id] -= 5
          break
      }
    })

    // 2. Get search keywords
    // Get the 50 most recent search queries
    const searchLogs = await UserBehaviorLog.findAll({
      where: {
        user_id: user_id.toString(),
        action_type: "SEARCH",
      },
      order: [["timestamp", "DESC"]],
      limit: 50,
    })

    // Extract and count keywords
    const keywords: { [key: string]: number } = {}

    searchLogs.forEach((log) => {
      if (!log.search_query) return

      const words = log.search_query
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.trim() !== "")

      words.forEach((word) => {
        if (!keywords[word]) {
          keywords[word] = 0
        }
        keywords[word] += 1
      })
    })

    // Create search terms for FULLTEXT search
    const searchTerms = Object.keys(keywords).join(" ")

    // 3. Get all dishes and calculate relevance scores
    let dishes
    if (searchTerms) {
      dishes = await sequelize.query(
        `SELECT d.*, 
         MATCH(d.name, d.description) AGAINST(:searchTerms IN BOOLEAN MODE) AS relevance
         FROM dishes d`,
        {
          replacements: { searchTerms },
          type: "SELECT",
          model: Dish,
          mapToModel: true,
        }
      )
    } else {
      // If no search terms, get all dishes without relevance
      dishes = await Dish.findAll()
      // Add relevance = 0 for all dishes
      dishes = dishes.map((dish) => {
        const plainDish = dish.get({ plain: true })
        return { ...plainDish, relevance: 0 }
      })
    }

    // 4. Calculate final priority scores
    const recommendedDishes = dishes.map((dish: any) => {
      const dishId = dish.id
      const behaviorScore = scoreMap[dishId] || 0
      const relevanceScore = dish.relevance ? parseFloat(dish.relevance) * 2 : 0
      const priorityScore = behaviorScore + relevanceScore

      return {
        ...dish,
        behavior_score: behaviorScore,
        relevance_score: relevanceScore,
        priority_score: priorityScore,
      }
    })

    // 5. Sort dishes by priority score
    recommendedDishes.sort((a: any, b: any) => b.priority_score - a.priority_score)

    // Add pagination
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const startIndex = (page - 1) * limit
    const endIndex = page * limit

    const paginatedDishes = recommendedDishes.slice(startIndex, endIndex)

    res.status(200).json({
      success: true,
      count: recommendedDishes.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(recommendedDishes.length / limit),
      },
      data: paginatedDishes,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Get all user behaviors
 * @route   GET /api/user-behaviors
 * @access  Private
 */
export const getAllUserBehaviors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Pagination
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const offset = (page - 1) * limit

    // Filtering
    const action_type = req.query.action_type as string | undefined
    const whereClause: any = {}
    if (action_type) {
      whereClause.action_type = action_type
    }

    // Get total count for pagination
    const count = await UserBehaviorLog.count({
      where: whereClause
    })

    // Get user behaviors with pagination
    const userBehaviors = await UserBehaviorLog.findAll({
      where: whereClause,
      order: [["timestamp", "DESC"]],
      limit: limit,
      offset: offset
    })

    res.status(200).json({
      success: true,
      count,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
      data: userBehaviors,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Get user behaviors by user ID
 * @route   GET /api/user-behaviors/:user_id
 * @access  Private
 */
export const getUserBehaviorsByUserId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.params
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      })
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const offset = (page - 1) * limit

    // Filtering
    const action_type = req.query.action_type as string | undefined
    const whereClause: any = { user_id }
    if (action_type) {
      whereClause.action_type = action_type
    }

    // Get total count for pagination
    const count = await UserBehaviorLog.count({
      where: whereClause
    })

    // Get user behaviors with pagination
    const userBehaviors = await UserBehaviorLog.findAll({
      where: whereClause,
      order: [["timestamp", "DESC"]],
      limit: limit,
      offset: offset
    })

    res.status(200).json({
      success: true,
      count,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
      data: userBehaviors,
    })
  } catch (error) {
    next(error)
  }
}