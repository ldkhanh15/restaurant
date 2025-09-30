import { UserPreference } from "../../models/userPreference.model";
import { v4 as uuidv4 } from "uuid";

export const UserPreferenceService = {
  async getPreferences(userId: string) {
    return UserPreference.findOne({
      where: { user_id: userId },
    });
  },

  async updatePreferences(userId: string, payload: any) {
    const [preference, created] = await UserPreference.findOrCreate({
      where: { user_id: userId },
      defaults: {
        id: uuidv4(),
        user_id: userId,
        ...payload,
        updated_at: new Date(),
      },
    });

    if (!created) {
      await preference.update({
        ...payload,
        updated_at: new Date(),
      });
    }

    return preference;
  },

  async updateTheme(userId: string, theme: "light" | "dark") {
    const [preference] = await UserPreference.findOrCreate({
      where: { user_id: userId },
      defaults: {
        id: uuidv4(),
        user_id: userId,
        theme,
        updated_at: new Date(),
      },
    });

    if (preference.theme !== theme) {
      await preference.update({ theme, updated_at: new Date() });
    }

    return preference;
  },

  async updateLanguage(userId: string, language: string) {
    const [preference] = await UserPreference.findOrCreate({
      where: { user_id: userId },
      defaults: {
        id: uuidv4(),
        user_id: userId,
        language,
        updated_at: new Date(),
      },
    });

    if (preference.language !== language) {
      await preference.update({ language, updated_at: new Date() });
    }

    return preference;
  },

  async updateNotificationSettings(userId: string, settings: object) {
    const [preference] = await UserPreference.findOrCreate({
      where: { user_id: userId },
      defaults: {
        id: uuidv4(),
        user_id: userId,
        notification_settings: settings,
        updated_at: new Date(),
      },
    });

    await preference.update({
      notification_settings: settings,
      updated_at: new Date(),
    });

    return preference;
  },

  async updateDietaryPreferences(userId: string, preferences: string[]) {
    const [preference] = await UserPreference.findOrCreate({
      where: { user_id: userId },
      defaults: {
        id: uuidv4(),
        user_id: userId,
        dietary_preferences: preferences,
        updated_at: new Date(),
      },
    });

    await preference.update({
      dietary_preferences: preferences,
      updated_at: new Date(),
    });

    return preference;
  },

  async addFavoriteDish(userId: string, dishId: string) {
    const [preference] = await UserPreference.findOrCreate({
      where: { user_id: userId },
      defaults: {
        id: uuidv4(),
        user_id: userId,
        favorite_dishes: [dishId],
        updated_at: new Date(),
      },
    });

    const favorites = preference.favorite_dishes || [];
    if (!favorites.includes(dishId)) {
      await preference.update({
        favorite_dishes: [...favorites, dishId],
        updated_at: new Date(),
      });
    }

    return preference;
  },

  async removeFavoriteDish(userId: string, dishId: string) {
    const preference = await UserPreference.findOne({
      where: { user_id: userId },
    });

    if (preference && preference.favorite_dishes) {
      await preference.update({
        favorite_dishes: preference.favorite_dishes.filter(
          (id) => id !== dishId
        ),
        updated_at: new Date(),
      });
    }

    return preference;
  },
};
