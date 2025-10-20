import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
} from "../controllers/userController";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

router.get("/", authenticate, getAllUsers);
router.get("/:id", authenticate, getUserById);
router.post("/", createUser);
router.put("/:id", authenticate, updateUser);
router.delete("/:id", authenticate, deleteUser);

export default router;
