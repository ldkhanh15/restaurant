import { Router } from "express"
import { signup, login, validateToken } from "../controllers/authController"
import { authenticate } from "../middlewares/auth"
import { body } from "express-validator"
import { validate } from "../middlewares/validator"

const router = Router()

router.post(
  "/signup",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    validate,
  ],
  signup,
)

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
    validate,
  ],
  login,
)

router.get("/validate", authenticate, validateToken)

export default router
