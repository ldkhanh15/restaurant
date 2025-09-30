import { Request, Response } from "express";
import { UserPreferenceService } from "./userPreference.service";

export const UserPreferenceController = {
  async getPreferences(req: Request, res: Response) {
    try {
      const data = await UserPreferenceService.getPreferences(
        req.params.userId
      );
      if (!data) {
        return res.status(404).json({ message: "User preferences not found" });
      }
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async updatePreferences(req: Request, res: Response) {
    try {
      const data = await UserPreferenceService.updatePreferences(
        req.params.userId,
        req.body
      );
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async updateTheme(req: Request, res: Response) {
    try {
      const { theme } = req.body;
      if (!["light", "dark"].includes(theme)) {
        return res.status(400).json({ message: "Invalid theme value" });
      }

      const data = await UserPreferenceService.updateTheme(
        req.params.userId,
        theme
      );
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async updateLanguage(req: Request, res: Response) {
    try {
      const { language } = req.body;
      const data = await UserPreferenceService.updateLanguage(
        req.params.userId,
        language
      );
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async updateNotificationSettings(req: Request, res: Response) {
    try {
      const data = await UserPreferenceService.updateNotificationSettings(
        req.params.userId,
        req.body
      );
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async updateDietaryPreferences(req: Request, res: Response) {
    try {
      const { preferences } = req.body;
      if (!Array.isArray(preferences)) {
        return res
          .status(400)
          .json({ message: "Preferences must be an array" });
      }

      const data = await UserPreferenceService.updateDietaryPreferences(
        req.params.userId,
        preferences
      );
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async addFavoriteDish(req: Request, res: Response) {
    try {
      const { dishId } = req.body;
      const data = await UserPreferenceService.addFavoriteDish(
        req.params.userId,
        dishId
      );
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async removeFavoriteDish(req: Request, res: Response) {
    try {
      const { dishId } = req.params;
      const data = await UserPreferenceService.removeFavoriteDish(
        req.params.userId,
        dishId
      );
      if (!data) {
        return res.status(404).json({ message: "User preferences not found" });
      }
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },
};
