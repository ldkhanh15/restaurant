import { UserBehaviorLog, User } from "../../models/index";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import { sequelize } from "../../config/database";

export const UserBehaviorLogService = {
  async list(filters?: any) {
    return UserBehaviorLog.findAll({
      where: filters,
      include: [
        {
          model: User,
          attributes: ["id", "full_name", "email"],
        },
      ],
      order: [["timestamp", "DESC"]],
    });
  },

  async logBehavior(payload: any) {
    const id = payload.id || uuidv4();
    return UserBehaviorLog.create({
      id,
      ...payload,
      timestamp: new Date(),
    });
  },

  async getUserBehavior(userId: string) {
    return UserBehaviorLog.findAll({
      where: { user_id: userId },
      order: [["timestamp", "DESC"]],
    });
  },

  async getActionAnalytics(startDate: Date, endDate: Date) {
    return UserBehaviorLog.findAll({
      where: {
        timestamp: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        "action_type",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["action_type"],
      order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
    });
  },
};
