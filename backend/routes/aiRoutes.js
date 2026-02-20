import express from "express";
import { handleAIChat, getAIHistory } from "../controllers/aiController.js";

const router = express.Router();

router.post("/chat", handleAIChat);
router.get("/history", getAIHistory);

export default router;
