import { Router } from "express";
import { UserPreferenceController } from "./userPreference.controller";

const router = Router();

// User preferences routes
router.get("/:userId/preferences", UserPreferenceController.getPreferences);
router.put("/:userId/preferences", UserPreferenceController.updatePreferences);
router.put("/:userId/preferences/theme", UserPreferenceController.updateTheme);
router.put(
  "/:userId/preferences/language",
  UserPreferenceController.updateLanguage
);
router.put(
  "/:userId/preferences/notifications",
  UserPreferenceController.updateNotificationSettings
);
router.put(
  "/:userId/preferences/dietary",
  UserPreferenceController.updateDietaryPreferences
);
router.post(
  "/:userId/preferences/favorite-dishes",
  UserPreferenceController.addFavoriteDish
);
router.delete(
  "/:userId/preferences/favorite-dishes/:dishId",
  UserPreferenceController.removeFavoriteDish
);

export default router;
