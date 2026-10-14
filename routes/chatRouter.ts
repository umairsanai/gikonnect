import express from "express";
import { getAllChats, getFullChat } from "../controllers/chat.js";
import { protect } from "../controllers/auth.js";

const router = express.Router();

router.get("/", protect, getAllChats);
router.get("/:id", protect, getFullChat); // id: recipient_id

export default router;
