import { Request, Response, NextFunction } from "express";
import pool from "../database.js";
import { AppError, handleAsyncError } from "../error.js";
import { isInteger, isString } from "../helpers.js";

export const getIncomingRequests = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const {rows: requests} = await pool.query("SELECT * FROM connection_requests WHERE recipient_id = $1 AND request_status = 'PENDING'", [req.user.user_id]);

    res.status(200).json({
        status: "success",
        data: requests
    });
});

export const getOutgoingRequests = handleAsyncError((async (req: Request, res: Response, next: NextFunction) => {
    const {rows: requests} = await pool.query("SELECT * FROM connection_requests WHERE sender_id = $1", [req.user.user_id]);
    
    res.status(200).json({
        status: "success",
        data: requests
    });
}));

export const sendRequest = handleAsyncError((async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) throw new AppError("Request body is required", 400);
    
    const { recipient_id, intent, request_description } = req.body;
    
    await pool.query("INSERT INTO connection_requests (sender_id, recipient_id, intent, request_description) VALUES ($1, $2, $3, $4)", [req.user.user_id, recipient_id, intent, request_description]);
    
    res.status(201).json({
        status: "success"
    });
}));

export const deleteRequest = handleAsyncError((async (req: Request, res: Response, next: NextFunction) => {
    if (!isString(req.params.id)) 
        throw new AppError("Invalid request ID", 400);

    const request_id = parseInt(req.params.id);

    if (!isInteger(request_id)) 
        throw new AppError("Invalid request ID", 400);

    await pool.query("DELETE FROM connection_requests WHERE sender_id = $1 AND request_id=$2", [req.user.user_id, request_id]);
    
    res.status(204).json({
        status: "success"
    });
}));

export const declineRequest = handleAsyncError((async (req: Request, res: Response, next: NextFunction) => {
    if (!isString(req.params.id)) 
        throw new AppError("Invalid request ID", 400);
    
    const request_id = parseInt(req.params.id);
    
    if (!isInteger(request_id)) 
        throw new AppError("Invalid request ID", 400);
    
    await pool.query("UPDATE connection_requests SET request_status='CANCELED' WHERE recipient_id = $1 AND request_id=$2", [req.user.user_id, request_id]);
    
    res.status(200).json({
        status: "success"    
    });
}));

export const acceptRequest = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    if (!isString(req.params.id)) 
        throw new AppError("Invalid request ID", 400);
    
    const request_id = parseInt(req.params.id);
    
    if (!isInteger(request_id)) 
        throw new AppError("Invalid request ID", 400);

    const client = await pool.connect();
    
    try {
        await client.query("BEGIN");
        
        const connection_request = (await client.query("SELECT * FROM connection_requests WHERE request_id = $1 AND recipient_id = $2 AND request_status = 'PENDING'", [request_id, req.user.user_id])).rows[0];        
        if (!connection_request) throw new AppError("Request not found or already processed", 404);
        
        await client.query("DELETE FROM connection_requests WHERE request_id = $1", [request_id]);        
        await client.query("INSERT INTO user_connections (user_id, connected_user_id) VALUES ($1, $2), ($2, $1)", [req.user.user_id, connection_request.sender_id]);
        await client.query("INSERT INTO chats (sender_id, recipient_id, chat_message) VALUES ($1, $2, $3)", [connection_request.sender_id, req.user.user_id, connection_request.request_description]);
        
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
    
    res.status(200).json({
        status: "success"
    });
});