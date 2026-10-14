import express from "express";
import { forgotPassword, login, logout, resetPassword, signup, verifyAccount } from "../controllers/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify", verifyAccount);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password", resetPassword);

export default router;