import { Request, Response, NextFunction } from "express";
import UserBehaviorLog from "../models/UserBehaviorLog";
import Dish from "../models/Dish";
import sequelize from "../config/database";

/**
 * @desc    Log user behavior
 * @route   POST /api/user-behavior
 * @access  Private
 */
export const logUserBehavior = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user_id, item_id, action_type, search_query } = req.body;
    console.log("Logging user behavior:", req.body);
    // Validate action type
    const validActionTypes = ["VIEW", "CLICK", "ORDER", "CANCEL", "SEARCH"];
    if (action_type && !validActionTypes.includes(action_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid action_type. Must be one of: ${validActionTypes.join(
          ", "
        )}`,
      });
    }

    // For SEARCH action, search_query is required
    if (action_type === "SEARCH" && !search_query) {
      return res.status(400).json({
        success: false,
        message: "search_query is required for SEARCH action",
      });
    }

    // For non-SEARCH actions, item_id is required
    if (action_type !== "SEARCH" && !item_id) {
      return res.status(400).json({
        success: false,
        message: "item_id is required for non-SEARCH actions",
      });
    }

    const userBehavior = await UserBehaviorLog.create({
      user_id,
      item_id,
      action_type,
      search_query,
    });

    res.status(201).json({
      success: true,
      data: userBehavior,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recommended dishes for a user based on behavior
 * @route   GET /api/dishes/recommended
 * @access  Private
 */
export const getRecommendedDishes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user_id } = req.query;

    console.log("Getting recommended dishes for user_id:", user_id);
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    // Action weights for scoring system
    const actionWeights = {
      ORDER: 1.0,
      CLICK: 0.6,
      VIEW: 0.3,
      CANCEL: -0.5,
    };

    const baseScore = 0.2; // Base score multiplier

    // 1. Calculate behavior scores and 2. Get search keywords in parallel
    const [behaviorLogs, searchLogs] = await Promise.all([
      // Get all behavior logs for the user
      UserBehaviorLog.findAll({
        where: {
          user_id: user_id.toString(),
          action_type: ["VIEW", "CLICK", "ORDER", "CANCEL"],
        },
      }),
      // Get the 50 most recent search queries
      UserBehaviorLog.findAll({
        where: {
          user_id: user_id.toString(),
          action_type: "SEARCH",
        },
        order: [["timestamp", "DESC"]],
        limit: 50,
      }),
    ]);

    // Initialize score map and action tracking
    const scoreMap: { [key: string]: number } = {};
    const dishActions: { [key: string]: string[] } = {}; // Track actions per dish

    // Calculate scores based on action types with weights
    behaviorLogs.forEach((log) => {
      if (!log.item_id || !log.action_type) return;

      if (!scoreMap[log.item_id]) {
        scoreMap[log.item_id] = 0;
        dishActions[log.item_id] = [];
      }

      // Track the action type for this dish
      if (!dishActions[log.item_id].includes(log.action_type)) {
        dishActions[log.item_id].push(log.action_type);
      }

      // Calculate score using baseScore * actionWeight
      const actionWeight =
        actionWeights[log.action_type as keyof typeof actionWeights] || 0;
      scoreMap[log.item_id] += baseScore * actionWeight;
    });

    // Extract and count keywords
    const keywords: { [key: string]: number } = {};

    searchLogs.forEach((log) => {
      if (!log.search_query) return;

      const words = log.search_query
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.trim() !== "");

      words.forEach((word) => {
        if (!keywords[word]) {
          keywords[word] = 0;
        }
        keywords[word] += 1;
      });
    });

    // Create search terms for FULLTEXT search
    const searchTerms = Object.keys(keywords).join(" ");

    // 3. Get all dishes and calculate relevance scores
    let dishes;
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
      );

      // Convert to plain objects
      dishes = dishes.map((dish: any) => dish.get({ plain: true }));
    } else {
      // If no search terms, get all dishes without relevance
      dishes = await Dish.findAll();
      // Add relevance = 0 for all dishes
      dishes = dishes.map((dish) => {
        const plainDish = dish.get({ plain: true });
        return { ...plainDish, relevance: 0 };
      });
    }

    // 3.5. Collaborative filtering: spread scores to similar dishes
    // Optimized: Pre-load all dish data and run similarity queries in parallel
    const interactedDishIds = Object.keys(scoreMap).filter(
      (id) => scoreMap[id] > 0
    );

    if (interactedDishIds.length > 0) {
      // Pre-load all dish names and descriptions for similarity calculation (single query)
      const allDishesForSimilarity = await Dish.findAll({
        attributes: ["id", "name", "description"],
        raw: true,
      });

      // Create a map for quick lookup
      const dishLookupMap = new Map(
        allDishesForSimilarity.map((dish) => [dish.id, dish])
      );

      // Prepare all similarity queries to run in parallel
      const similarityPromises = interactedDishIds.map(async (dishId) => {
        const currentDish = dishLookupMap.get(dishId);
        if (!currentDish) return null;

        const currentScore = scoreMap[dishId];
        const actions = dishActions[dishId] || [];
        const searchText = `${currentDish.name} ${
          currentDish.description || ""
        }`.trim();

        try {
          // Find similar dishes using MATCH AGAINST
          const similarDishes = await sequelize.query(
            `SELECT d.id,
                MATCH(d.name, d.description) AGAINST(:searchText IN NATURAL LANGUAGE MODE) AS similarity
                FROM dishes d
                WHERE d.id != :currentDishId
                HAVING similarity > 0.001
                ORDER BY similarity DESC
                LIMIT 10`,
            {
              replacements: {
                searchText,
                currentDishId: dishId,
              },
              type: "SELECT",
              raw: true,
            }
          );

          return {
            dishId,
            currentDish,
            currentScore,
            actions,
            similarDishes,
          };
        } catch (error) {
          console.error(`Error finding similar dishes for ${dishId}:`, error);
          return null;
        }
      });

      // Execute all similarity queries in parallel
      const similarityResults = await Promise.all(similarityPromises);

      // Process results and apply bonus scores
      similarityResults.forEach((result) => {
        if (!result) return;

        const { dishId, currentDish, currentScore, actions, similarDishes } =
          result;

        console.log(
          `Found ${similarDishes.length} similar dishes for Dish ${dishId} (${
            currentDish.name
          }) with actions: ${actions.join(", ")}`
        );

        // Spread score to similar dishes based on action weights
        similarDishes.forEach((similarDish: any, index: number) => {
          const similarity = parseFloat(similarDish.similarity);
          console.log(
            `Dish ${dishId} (${currentDish.name}) -> Similar dish ${
              similarDish.id
            }: similarity=${similarity.toFixed(3)}`
          );

          // Calculate spread factor based on the strongest action weight
          const strongestAction = actions.reduce((strongest, action) => {
            const currentWeight =
              actionWeights[action as keyof typeof actionWeights] || 0;
            const strongestWeight =
              actionWeights[strongest as keyof typeof actionWeights] || 0;
            return Math.abs(currentWeight) > Math.abs(strongestWeight)
              ? action
              : strongest;
          }, actions[0]);

          const actionWeight =
            actionWeights[strongestAction as keyof typeof actionWeights] || 0.3;
          const spreadFactor = 0.5 * Math.abs(actionWeight); // Spread factor based on action weight

          const bonusScore = currentScore * spreadFactor * similarity;

          if (!scoreMap[similarDish.id]) {
            scoreMap[similarDish.id] = 0;
          }
          scoreMap[similarDish.id] += bonusScore;

          console.log(
            `Bonus score: ${bonusScore.toFixed(
              2
            )} (currentScore: ${currentScore}, actionWeight: ${actionWeight}, spreadFactor: ${spreadFactor}, similarity: ${similarity})`
          );
        });
      });
    }

    // 3.6. Calculate recency scores
    const recencyMap: { [key: string]: number } = {};
    const now = new Date();

    behaviorLogs.forEach((log) => {
      if (!log.item_id || !log.timestamp) return;

      const hoursSinceAction =
        (now.getTime() - log.timestamp.getTime()) / (1000 * 60 * 60);
      // Recency score: higher for more recent actions (max 10 points for actions within 1 hour)
      const recencyScore = Math.max(0, 14 - hoursSinceAction);

      if (!recencyMap[log.item_id]) {
        recencyMap[log.item_id] = 0;
      }
      recencyMap[log.item_id] = Math.max(recencyMap[log.item_id], recencyScore);
    });

    // 4. Calculate normalized scores and create final recommendations
    const maxScore = Math.max(...Object.values(scoreMap));
    const minScore = Math.min(...Object.values(scoreMap));

    // Calculate relevance scores statistics in a single pass
    let maxRelevance = 0;
    let minRelevance = Infinity;
    let hasRelevanceData = false;

    dishes.forEach((dish) => {
      const relevance = dish.relevance ? parseFloat(dish.relevance) : 0;
      if (relevance > 0) {
        maxRelevance = Math.max(maxRelevance, relevance);
        minRelevance = Math.min(minRelevance, relevance);
        hasRelevanceData = true;
      }
    });

    // If no relevance data, set defaults
    if (!hasRelevanceData) {
      maxRelevance = 1;
      minRelevance = 0;
    }

    const recommendedDishes = dishes.map((dish: any) => {
      const dishId = dish.id;
      const behaviorScore = scoreMap[dishId] || 0;

      // Normalize behavior score to 0-100 range
      const normalizedBehaviorScore =
        maxScore > minScore
          ? ((behaviorScore - minScore) / (maxScore - minScore)) * 100
          : 50; // Default to 50 if all scores are equal

      // Normalize relevance score to 0-100 range
      const rawRelevanceScore = dish.relevance ? parseFloat(dish.relevance) : 0;
      const normalizedRelevanceScore =
        maxRelevance > minRelevance
          ? ((rawRelevanceScore - minRelevance) /
              (maxRelevance - minRelevance)) *
            100
          : 0; // Default to 0 if no relevance variation

      // Calculate recency score (normalized to 0-100)
      const recencyScore = recencyMap[dishId] || 0;
      const normalizedRecencyScore = Math.min(100, recencyScore * 10); // Convert to 0-100 scale

      // Calculate balanced priority score with equal weights for all components
      const priorityScore =
        normalizedBehaviorScore * 0.4 +
        normalizedRelevanceScore * 0.4 +
        normalizedRecencyScore * 0.2;

      console.log(
        `Dish ${dishId}: behavior=${behaviorScore.toFixed(
          2
        )} (${normalizedBehaviorScore.toFixed(
          1
        )}), relevance=${rawRelevanceScore.toFixed(
          4
        )} (${normalizedRelevanceScore.toFixed(
          1
        )}), recency=${recencyScore.toFixed(
          1
        )} (${normalizedRecencyScore.toFixed(
          1
        )}), priority=${priorityScore.toFixed(2)}`
      );

      return {
        ...dish,
        behavior_score: parseFloat(behaviorScore.toFixed(2)),
        normalized_behavior_score: parseFloat(
          normalizedBehaviorScore.toFixed(2)
        ),
        relevance_score: parseFloat(rawRelevanceScore.toFixed(4)),
        normalized_relevance_score: parseFloat(
          normalizedRelevanceScore.toFixed(2)
        ),
        recency_score: parseFloat(recencyScore.toFixed(2)),
        normalized_recency_score: parseFloat(normalizedRecencyScore.toFixed(2)),
        priority_score: parseFloat(priorityScore.toFixed(2)),
      };
    });

    // 5. Sort dishes by priority score
    recommendedDishes.sort(
      (a: any, b: any) => b.priority_score - a.priority_score
    );

    // filter by list of category IDs
    const categoryIdsParam = req.query.category_ids as string | undefined;
    // Start with all recommended dishes; apply category filter if provided
    let filteredRecommendedDishes = recommendedDishes;
    if (categoryIdsParam) {
      const categoryIds = categoryIdsParam.split(",").map((id) => id.trim());
      filteredRecommendedDishes = recommendedDishes.filter((dish: any) =>
        categoryIds.includes(String(dish.category_id))
      );
    }

    // 🔍 Filter by search term (tìm kiếm liên quan, bỏ dấu, nhiều từ khóa)
    const searchTerm = req.query.search_term as string | undefined;
    console.log("Applying search term filter:", searchTerm);

    if (searchTerm) {
      // Hàm bỏ dấu tiếng Việt
      const removeDiacritics = (str: string) =>
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      const keywords = removeDiacritics(searchTerm.toLowerCase())
        .split(/\s+/) // tách theo khoảng trắng
        .filter((word) => word.trim() !== ""); // bỏ trống

      filteredRecommendedDishes = filteredRecommendedDishes.filter(
        (dish: any) => {
          const dishName = removeDiacritics(dish.name.toLowerCase());
          // Nếu tên món chứa ít nhất 1 từ khóa thì giữ lại
          return keywords.some((keyword) => dishName.includes(keyword));
        }
      );
    }

    // Add pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedDishes = filteredRecommendedDishes.slice(
      startIndex,
      endIndex
    );

    res.status(200).json({
      success: true,
      count: filteredRecommendedDishes.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(filteredRecommendedDishes.length / limit),
      },
      data: paginatedDishes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all user behaviors
 * @route   GET /api/user-behaviors
 * @access  Private
 */
export const getAllUserBehaviors = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Filtering
    const action_type = req.query.action_type as string | undefined;
    const whereClause: any = {};
    if (action_type) {
      whereClause.action_type = action_type;
    }

    // Get total count for pagination
    const count = await UserBehaviorLog.count({
      where: whereClause,
    });

    // Get user behaviors with pagination
    const userBehaviors = await UserBehaviorLog.findAll({
      where: whereClause,
      order: [["timestamp", "DESC"]],
      limit: limit,
      offset: offset,
    });

    res.status(200).json({
      success: true,
      count,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
      data: userBehaviors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user behaviors by user ID
 * @route   GET /api/user-behaviors/:user_id
 * @access  Private
 */
export const getUserBehaviorsByUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Filtering
    const action_type = req.query.action_type as string | undefined;
    const whereClause: any = { user_id };
    if (action_type) {
      whereClause.action_type = action_type;
    }

    // Get total count for pagination
    const count = await UserBehaviorLog.count({
      where: whereClause,
    });

    // Get user behaviors with pagination
    const userBehaviors = await UserBehaviorLog.findAll({
      where: whereClause,
      order: [["timestamp", "DESC"]],
      limit: limit,
      offset: offset,
    });

    res.status(200).json({
      success: true,
      count,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
      data: userBehaviors,
    });
  } catch (error) {
    next(error);
  }
};
