import { NextFunction, Request, Response } from "express";
import pool from "../database.js";
import { AppError, handleAsyncError } from "../error.js";
import { isInteger, isString } from "../helpers.js";

const CHAT_PAGINATION_MESSAGE_LIMIT = 50  // Messages Count

export const getAllChats = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { rows } = await pool.query(`SELECT uc_user.user_id, uc_user.name, uc_user.profile_url, ch.chat_message, ch.sent_at::TEXT, ch.is_read FROM (SELECT user_id, connected_user_id FROM user_connections WHERE user_id=$1) AS uc INNER JOIN users uc_user ON uc.connected_user_id = uc_user.user_id LEFT JOIN LATERAL (SELECT chat_message, sent_at, is_read FROM chats WHERE (sender_id = uc.user_id AND recipient_id = uc.connected_user_id) OR (recipient_id = uc.user_id AND sender_id = uc.connected_user_id) ORDER BY sent_at DESC LIMIT 1) ch ON true ORDER BY ch.sent_at DESC, ch.is_read ASC`, [req.user.user_id]);

    res.status(200).json({
        status: "success",
        data: rows
    });
});

export const getFullChat = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    if (!isString(req.query.page) || !isString(req.params.id)) 
        throw new AppError("Invalid request", 400);

    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    if (!isInteger(page) || page < 1) throw new AppError("Invalid page", 400);

    const recipient_id = parseInt(req.params.id, 10);
    if (!isInteger(recipient_id)) throw new AppError("Invalid recipient id", 400);

    const { rows } = await pool.query("SELECT c.chat_message, c.sent_at, c.sender_id AS sent_by FROM chats c WHERE (c.sender_id = $1 AND c.recipient_id = $2) OR (c.recipient_id = $1 AND c.sender_id = $2) ORDER BY c.sent_at DESC LIMIT $3 OFFSET $4", [req.user.user_id, recipient_id, CHAT_PAGINATION_MESSAGE_LIMIT, (page - 1) * CHAT_PAGINATION_MESSAGE_LIMIT]);

    res.status(200).json({
        status: "success",
        data: rows
    });
});
