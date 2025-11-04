import { Router } from "express";

const router = Router();

// Placeholder routes for chat messages
router.get("/", (req, res) => {
  res.json({ message: "Chat messages endpoint - to be implemented" });
});

router.post("/", (req, res) => {
  res.json({ message: "Create chat message endpoint - to be implemented" });
});

export default router;