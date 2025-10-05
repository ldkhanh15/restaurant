import express from "express"
import { 
  logUserBehavior, 
  getRecommendedDishes,
  getAllUserBehaviors,
  getUserBehaviorsByUserId
} from "../controllers/userBehaviorController"
import { authenticate } from "../middlewares/auth"

const router = express.Router()

// Log user behavior
router.post("/user-behavior", logUserBehavior)

// Get recommended dishes
router.get("/dishes",  getRecommendedDishes)

// Get all user behaviors
router.get("/user-behaviors",getAllUserBehaviors)

// Get user behaviors by user ID
router.get("/user-behaviors/:user_id", getUserBehaviorsByUserId)

export default router