import { BaseService } from "./baseService";
import Review from "../models/Review";
import User from "../models/User";
import { FindOptions, Order } from "sequelize";

// Define a custom error that can hold a status code
class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

class ReviewService extends BaseService<Review> {
  constructor() {
    super(Review);
  }

  /**
   * Get reviews with sorting and pagination
   * @param query - Query parameters from the request
   */
  async getReviews(query: {
    sort_by?: string;
    page?: string;
    limit?: string;
  }) {
    const { sort_by, page = "1", limit = "10" } = query;

    const findOptions: FindOptions = {
      include: [
        {
          model: User,
          as: "user",
          // select full_name and map to `name` in JS to avoid SQL aliasing issues
          // only include columns that actually exist on the users table
          attributes: ["id", "full_name"], // Select user fields (full_name returned)
        },
      ],
      limit: parseInt(limit, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
    };

    // Apply sorting
    const order: Order = [];
    if (sort_by === "rating_desc") {
      order.push(["rating", "DESC"]);
    } else {
      // Default sort by newest
      order.push(["created_at", "DESC"]);
    }
    findOptions.order = order;

    const result = await this.findAll(findOptions);

    // Normalize rows to plain objects and map user.full_name -> user.name for frontend compatibility
    const rowsPlain = result.rows.map((r: any) => {
      const obj = r.toJSON ? r.toJSON() : r;
      if (obj.user && obj.user.full_name && !obj.user.name) {
        obj.user.name = obj.user.full_name;
      }
      return obj;
    });

    return { rows: rowsPlain, count: result.count };
  }

  /**
   * Create a new review
   * @param userId - The ID of the user creating the review
   * @param reviewData - The data for the new review
   */
  async createReview(
    userId: string,
    reviewData: { rating: number; comment: string; order_id?: string; dish_id?: string; table_id?: string; order_item_id?: string }
  ) {
    const { rating, comment, order_id, dish_id, table_id, order_item_id } = reviewData;

    if (!comment) {
      throw new AppError("Comment is required", 400);
    }

    if (rating === undefined || rating < 1 || rating > 5) {
      throw new AppError("A rating between 1 and 5 is required", 400);
    }

    // Determine review type: prefer dish-level references, then table/order references.
    // This prevents Sequelize notNull violations when frontend omits 'type'.
    let type: "dish" | "table" | undefined;
    if (dish_id || order_item_id) {
      type = "dish";
    } else if (table_id || order_id) {
      type = "table";
    }

    if (!type) {
      // No target specified; require the client to reference either a dish (dish_id/order_item_id) or a table/order
      throw new AppError("Review must reference a target: provide dish_id/order_item_id or table_id/order_id", 400);
    }

    const created = await this.create({
      user_id: userId,
      rating,
      comment,
      order_id,
      order_item_id,
      dish_id,
      table_id,
      type,
    });

    // Fetch the created review including the user so the response contains the user's name
    const fetched = await this.findById((created as any).id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "full_name"],
        },
      ],
    });

    // Normalize to plain object and map full_name -> name for frontend
    const obj = (fetched as any).toJSON ? (fetched as any).toJSON() : fetched;
    if (obj.user && obj.user.full_name && !obj.user.name) {
      obj.user.name = obj.user.full_name;
    }

    return obj;
  }

  async findAllWithUser(options?: any) {
    return await this.findAll({
      ...options,
      include: [{ model: User, as: "user" }],
    });
  }
}

export default new ReviewService();
