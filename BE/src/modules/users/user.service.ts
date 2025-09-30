import { User, UserPreference, UserBehaviorLog } from "../../models";
import { v4 as uuidv4 } from "uuid";
import {
  CreateUserDTO,
  UpdateUserDTO,
  UserPreferenceDTO,
  UserBehaviorLogDTO,
} from "../../types/dtos/user.dto";
import bcrypt from "bcrypt";

export const UserService = {
  async list() {
    return User.findAll({
      attributes: { exclude: ["password"] },
      include: ["preferences"],
    });
  },

  async get(id: string) {
    return User.findByPk(id, {
      attributes: { exclude: ["password"] },
      include: ["preferences", "orders", "reviews", "complaints"],
    });
  },

  async create(payload: CreateUserDTO) {
    const id = payload.id || uuidv4();

    // Hash password
    const hashedPassword = await bcrypt.hash(payload.password, 10);

    const user = await User.create({
      id,
      ...payload,
      password: hashedPassword,
      created_at: new Date(),
    });

    // Create default preferences
    await UserPreference.create({
      id: uuidv4(),
      user_id: user.id,
      theme: "system",
      language: "en",
      notification_settings: {
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        marketing_emails: true,
      },
    });

    return this.get(user.id);
  },

  async update(id: string, payload: UpdateUserDTO) {
    const user = await User.findByPk(id);
    if (!user) return null;

    // If password is being updated, hash it
    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }

    await user.update({
      ...payload,
      updated_at: new Date(),
    });

    return this.get(id);
  },

  async remove(id: string) {
    const user = await User.findByPk(id);
    if (!user) return false;
    await user.destroy();
    return true;
  },

  async updatePreferences(id: string, preferences: UserPreferenceDTO) {
    const userPrefs = await UserPreference.findOne({ where: { user_id: id } });

    if (userPrefs) {
      await userPrefs.update({
        ...preferences,
        updated_at: new Date(),
      });
    } else {
      await UserPreference.create({
        id: uuidv4(),
        user_id: id,
        ...preferences,
        created_at: new Date(),
      });
    }

    return User.findByPk(id, {
      attributes: { exclude: ["password"] },
      include: ["preferences"],
    });
  },

  async logUserBehavior(payload: UserBehaviorLogDTO) {
    return UserBehaviorLog.create({
      id: uuidv4(),
      ...payload,
      timestamp: new Date(),
    });
  },

  async getUserBehaviorLogs(userId: string) {
    return UserBehaviorLog.findAll({
      where: { user_id: userId },
      order: [["timestamp", "DESC"]],
    });
  },

  async validatePassword(id: string, password: string): Promise<boolean> {
    const user = await User.findByPk(id);
    if (!user) return false;

    return bcrypt.compare(password, user.password);
  },
};
