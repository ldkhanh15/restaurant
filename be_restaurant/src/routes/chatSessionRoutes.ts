import { Router } from "express";

const router = Router();

// Placeholder routes for chat sessions
router.get("/", (req, res) => {
  res.json({ message: "Chat sessions endpoint - to be implemented" });
});

router.post("/", (req, res) => {
  res.json({ message: "Create chat session endpoint - to be implemented" });
});

export default router;