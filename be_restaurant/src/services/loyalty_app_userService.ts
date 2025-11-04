import User from "../models/User";
import Order from "../models/Order";
import notificationAppUserService from "./notification_app_userService";

/**
 * Simple loyalty service.
 * - Awards points when an order is paid.
 * - Points calculation: 1 point per 1000 VND (configurable)
 * - Updates user.ranking based on thresholds:
 *    - regular: < 1000
 *    - vip: >= 1000
 *    - platinum: >= 2500
 */
class LoyaltyService {
  private POINTS_PER_VND = 1 / 1000; // 1 point per 1000 VND
  private VIP_THRESHOLD = 1000;
  private PLATINUM_THRESHOLD = 2500;

  async awardPointsForOrder(order: any) {
    if (!order || !order.user_id) return null;

    try {
      const user = await User.findByPk(order.user_id as string);
      if (!user) return null;

      const amount = Number(order.final_amount || order.total_amount || 0);
      if (amount <= 0) return null;

      const pointsToAdd = Math.floor(amount * this.POINTS_PER_VND);
      if (pointsToAdd <= 0) return null;

      const newPoints = (user.points || 0) + pointsToAdd;

      // Determine new ranking
      let newRanking: typeof user.ranking = user.ranking;
      if (newPoints >= this.PLATINUM_THRESHOLD) newRanking = "platinum";
      else if (newPoints >= this.VIP_THRESHOLD) newRanking = "vip";
      else newRanking = "regular";

      await user.update({ points: newPoints, ranking: newRanking });

      // Create an app_user notification for the user
      try {
        await notificationAppUserService.create({
          type: "loyalty_points_awarded",
          title: "Bạn vừa nhận được điểm",
          content: `Bạn vừa được cộng ${pointsToAdd} điểm. Tổng điểm hiện tại: ${newPoints} điểm.`,
          user_id: user.id,
          data: { order_id: order.id, added: pointsToAdd, newPoints, newRanking },
        } as any);
      } catch (err) {
        console.error("[loyalty] failed to create app_user notification:", err);
      }

      return { userId: user.id, added: pointsToAdd, newPoints, newRanking };
    } catch (error) {
      console.error("[loyalty] awardPointsForOrder error:", error);
      return null;
    }
  }
}

export default new LoyaltyService();
