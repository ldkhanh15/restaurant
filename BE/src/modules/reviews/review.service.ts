import { Review, User, Order, Dish } from "../../models/index";
import { v4 as uuidv4 } from "uuid";
import { Op, fn, col, literal } from "sequelize";
import {
  CreateReviewDTO,
  UpdateReviewDTO,
  ReviewResponseDTO,
  ReviewAnalyticsDTO,
} from "../../types/dtos/review.dto";
import { NotificationService } from "../notifications/notification.service";

export const ReviewService = {
  async list() {
    return Review.findAll({
      include: [
        "user",
        {
          model: Order,
          attributes: ["id", "order_number", "created_at"],
        },
        {
          model: Dish,
          attributes: ["id", "name", "category"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
  },

  async get(id: string) {
    return Review.findByPk(id, {
      include: [
        "user",
        {
          model: Order,
          attributes: ["id", "order_number", "created_at"],
        },
        {
          model: Dish,
          attributes: ["id", "name", "category"],
        },
      ],
    });
  },

  async create(payload: CreateReviewDTO) {
    const id = payload.id || uuidv4();

    // Auto-detect sentiment if not provided
    if (!payload.sentiment) {
      payload.sentiment = this.analyzeSentiment(
        payload.content,
        payload.rating
      );
    }

    const review = await Review.create({
      id,
      ...payload,
      status: payload.status || "pending",
      created_at: new Date(),
    });

    // Notify administrators about new review
    await NotificationService.create({
      user_id: "admin", // Assuming there's an admin notification channel
      title: "New Review Submitted",
      message: `New ${payload.rating}-star review received${
        payload.dish_id ? " for a dish" : ""
      }`,
      type: "new_review",
      data: {
        review_id: review.id,
        rating: payload.rating,
      },
    });

    // If it's a dish review, update dish rating
    if (payload.dish_id) {
      await this.updateDishRating(payload.dish_id);
    }

    return this.get(review.id);
  },

  async update(id: string, payload: UpdateReviewDTO) {
    const review = await Review.findByPk(id);
    if (!review) return null;

    await review.update({
      ...payload,
      updated_at: new Date(),
    });

    // If status changes to approved, notify the user
    if (payload.status === "approved" && review.status !== "approved") {
      await NotificationService.create({
        user_id: review.user_id,
        title: "Review Approved",
        message: "Your review has been approved and is now public",
        type: "review_status",
        data: {
          review_id: review.id,
        },
      });
    }

    // If admin response is added, notify the user
    if (payload.admin_response && !review.admin_response) {
      await NotificationService.create({
        user_id: review.user_id,
        title: "Response to Your Review",
        message: "We've responded to your review",
        type: "review_response",
        data: {
          review_id: review.id,
        },
      });
    }

    return this.get(id);
  },

  async remove(id: string) {
    const review = await Review.findByPk(id);
    if (!review) return false;

    // If it's a dish review, update dish rating after removal
    if (review.dish_id) {
      await review.destroy();
      await this.updateDishRating(review.dish_id);
    } else {
      await review.destroy();
    }

    return true;
  },

  async getAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<ReviewAnalyticsDTO> {
    const whereClause =
      startDate && endDate
        ? {
            created_at: {
              [Op.between]: [startDate, endDate],
            },
          }
        : {};

    const [
      averageRating,
      totalReviews,
      ratingDistribution,
      sentimentDistribution,
      tags,
    ] = await Promise.all([
      Review.findOne({
        where: whereClause,
        attributes: [[fn("AVG", col("rating")), "average_rating"]],
      }),
      Review.count({ where: whereClause }),
      Review.findAll({
        where: whereClause,
        attributes: ["rating", [fn("COUNT", col("id")), "count"]],
        group: ["rating"],
        order: [["rating", "ASC"]],
      }),
      Review.findAll({
        where: whereClause,
        attributes: ["sentiment", [fn("COUNT", col("id")), "count"]],
        group: ["sentiment"],
      }),
      Review.findAll({
        where: whereClause,
        attributes: [
          [fn("UNNEST", col("tags")), "tag"],
          [fn("COUNT", col("id")), "count"],
        ],
        group: ["tag"],
        order: [[literal("count"), "DESC"]],
        limit: 10,
      }),
    ]);

    // Calculate recent trends (last 30 days if no date range provided)
    const trendEndDate = endDate || new Date();
    const trendStartDate =
      startDate || new Date(trendEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const trends = await Review.findAll({
      where: {
        created_at: {
          [Op.between]: [trendStartDate, trendEndDate],
        },
      },
      attributes: [
        [fn("DATE", col("created_at")), "date"],
        [fn("AVG", col("rating")), "average_rating"],
        [fn("COUNT", col("id")), "review_count"],
      ],
      group: [fn("DATE", col("created_at"))],
      order: [[fn("DATE", col("created_at")), "ASC"]],
    });

    return {
      average_rating:
        parseFloat(averageRating?.getDataValue("average_rating")) || 0,
      total_reviews: totalReviews,
      rating_distribution: ratingDistribution.reduce(
        (acc, curr) => ({
          ...acc,
          [curr.rating]: parseInt(curr.getDataValue("count")),
        }),
        {}
      ),
      sentiment_distribution: sentimentDistribution.reduce(
        (acc, curr) => ({
          ...acc,
          [curr.sentiment]: parseInt(curr.getDataValue("count")),
        }),
        { positive: 0, neutral: 0, negative: 0 }
      ),
      common_tags: tags.map((t) => ({
        tag: t.getDataValue("tag"),
        count: parseInt(t.getDataValue("count")),
      })),
      recent_trends: trends.map((t) => ({
        date: t.getDataValue("date"),
        average_rating: parseFloat(t.getDataValue("average_rating")),
        review_count: parseInt(t.getDataValue("review_count")),
      })),
    };
  },

  async updateDishRating(dishId: string) {
    const ratings = await Review.findOne({
      where: {
        dish_id: dishId,
        status: "approved",
      },
      attributes: [
        [fn("AVG", col("rating")), "average_rating"],
        [fn("COUNT", col("id")), "total_reviews"],
      ],
    });

    await Dish.update(
      {
        average_rating: ratings?.getDataValue("average_rating") || 0,
        review_count: ratings?.getDataValue("total_reviews") || 0,
        updated_at: new Date(),
      },
      {
        where: { id: dishId },
      }
    );
  },

  analyzeSentiment(
    content?: string,
    rating?: number
  ): "positive" | "neutral" | "negative" {
    if (!rating) return "neutral";

    // Simple sentiment analysis based on rating
    if (rating >= 4) return "positive";
    if (rating <= 2) return "negative";
    return "neutral";
  },
};
